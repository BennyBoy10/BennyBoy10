#!/usr/bin/env python3
"""BennyBoy Downloads organiser.

Usage:  python organize.py
1. Sorts everything inside ./Downloads into category folders
   (Facebook/YouTube folders merge into Downloads/Videos/<Source>).
2. Cleans filenames, never overwrites (duplicates become "name (2).ext").
3. Removes yt-dlp junk and empty folders.
4. Makes thumbnails + reads duration/resolution (needs ffmpeg).
5. Rebuilds Files.json (files that no longer exist are dropped).
"""
import hashlib, json, os, re, shutil, subprocess, unicodedata
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
DL, THUMBS, MANIFEST = BASE / "Downloads", BASE / "Thumbnails", BASE / "Files.json"

TYPES = {
    "Videos": "mp4 mkv webm mov avi m4v 3gp flv wmv mpg mpeg ts",
    "Audio": "mp3 m4a aac wav flac ogg opus wma amr",
    "Images": "jpg jpeg png gif webp heic bmp svg tiff",
    "Documents": "pdf doc docx xls xlsx ppt pptx txt csv epub rtf odt",
    "Applications": "apk xapk exe msi dmg ipa deb appimage",
    "Archives": "zip rar 7z tar gz bz2 xz",
}
CATS = list(TYPES) + ["Others"]
EXT = {e: c for c, es in TYPES.items() for e in es.split()}
SOURCES = {"facebook": "Facebook", "youtube": "YouTube"}
JUNK_NAMES = {"archive.txt", "desktop.ini", "thumbs.db"}
JUNK_EXT = {".part", ".ytdl", ".tmp", ".temp", ".crdownload"}
BAD = re.compile(r'[<>:"/\\|?*#%\x00-\x1f]')
HAS_FF = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))


def clean(name):
    name = unicodedata.normalize("NFC", name.encode("utf-8", "ignore").decode("utf-8"))
    stem, ext = os.path.splitext(name)
    stem = re.sub(r"\s+", " ", BAD.sub("", stem)).strip(" .")
    ext = BAD.sub("", ext).lower()
    while len(stem.encode()) > 180:
        stem = stem[:-1]
    return (stem.rstrip(" .") or "file") + ext


def unique(p):
    n = 2
    while p.exists():
        p = p.with_name(f"{p.stem} ({n}){p.suffix}")
        n += 1
    return p


def organise():
    moved = 0
    for src in sorted(p for p in DL.rglob("*") if p.is_file()):
        low = src.name.lower()
        if low in JUNK_NAMES or src.suffix.lower() in JUNK_EXT or src.name.startswith("."):
            src.unlink()
            continue
        rel = src.relative_to(DL).parts
        cat = EXT.get(src.suffix.lower().lstrip("."), "Others")
        if rel[0] == cat:
            folder = src.parent
        else:
            folder = DL / cat
            if cat == "Videos":
                tag = next((SOURCES[x.lower()] for x in rel[:-1] if x.lower() in SOURCES), None)
                if tag:
                    folder = folder / tag
        dst = folder / clean(src.name)
        if dst == src:
            continue
        folder.mkdir(parents=True, exist_ok=True)
        dst = unique(dst)
        shutil.move(str(src), str(dst))
        moved += 1
    for d in sorted((p for p in DL.rglob("*") if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()
    return moved


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


def probe(f):
    r = run("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=height", "-of", "json", str(f))
    try:
        j = json.loads(r.stdout)
        dur = int(float(j["format"].get("duration", 0)))
        hs = [s["height"] for s in j.get("streams", []) if s.get("height")]
        return dur, (f"{max(hs)}p" if hs else "")
    except Exception:
        return 0, ""


def make_thumb(f, key, dur, cat):
    t = THUMBS / (hashlib.sha1(key.encode()).hexdigest()[:14] + ".jpg")
    if not t.exists():
        ss = ["-ss", str(min(max(dur * 0.1, 0.5), 8))] if cat == "Videos" and dur > 1 else []
        run("ffmpeg", "-y", "-v", "error", *ss, "-i", str(f), "-an", "-frames:v", "1",
            "-vf", "scale=400:-2", "-q:v", "5", str(t))
    if t.exists() and t.stat().st_size > 0:
        return f"Thumbnails/{t.name}"
    t.unlink(missing_ok=True)
    return ""


def human(b):
    for u in ("B", "KB", "MB", "GB"):
        if b < 1024 or u == "GB":
            return f"{b:.0f} B" if u == "B" else f"{b:.2f} {u}"
        b /= 1024


def build():
    old = {}
    if MANIFEST.exists():
        try:
            old = {f["path"]: f for f in json.loads(MANIFEST.read_text("utf-8")).get("files", [])}
        except Exception:
            pass
    THUMBS.mkdir(exist_ok=True)
    files, keep = [], set()
    for f in sorted(DL.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(DL).parts
        if rel[0] not in CATS:
            continue
        cat, path = rel[0], "Downloads/" + "/".join(rel)
        e = old.get(path, {})
        dur, res = e.get("duration", 0), e.get("resolution", "")
        if HAS_FF and cat in ("Videos", "Audio") and not dur:
            dur, res = probe(f)
        thumb = ""
        if HAS_FF and cat in ("Videos", "Audio", "Images"):
            thumb = make_thumb(f, path, dur, cat)
            if thumb:
                keep.add(thumb.split("/")[1])
        size = f.stat().st_size
        files.append({
            "category": cat,
            "source": rel[1] if cat == "Videos" and len(rel) > 2 else "",
            "name": f.name, "desc": "", "size": human(size), "bytes": size,
            "duration": dur, "resolution": res, "thumb": thumb,
            "added": e.get("added") or date.today().isoformat(), "path": path,
        })
    for t in THUMBS.glob("*.jpg"):
        if t.name not in keep:
            t.unlink()
    files.sort(key=lambda x: (x["added"], x["name"]), reverse=True)
    MANIFEST.write_text(json.dumps({"generated": date.today().isoformat(), "files": files},
                                   indent=2, ensure_ascii=False), "utf-8")
    return len(files)


if __name__ == "__main__":
    DL.mkdir(exist_ok=True)
    if not HAS_FF:
        print("Note: ffmpeg not found. Run `pkg install ffmpeg` for thumbnails and durations.")
    moved = organise()
    total = build()
    print(f"Done. Moved {moved} file(s). Files.json now lists {total} file(s).")
