#!/usr/bin/env python3
"""Règle PRO #2 : HIÉRARCHIE VISUELLE — keyword popups TikTok-style.
Extrait les mots-clés forts du transcript (fréquence + filtre stopwords),
génère des popups animés 1.5s (chips dorées) positionnés y≈450 (au-dessus
visage) lors de chaque apparition. Ajoute les overlays dans edl.json.

Usage: python keyword_popup.py  (lit edl.json + transcripts/*_vu.json)
"""
import json, os, re, subprocess
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

EDIT = Path(__file__).parent
EDL  = EDIT / "edl.json"
OUT  = EDIT / "broll_clips"
os.makedirs(OUT, exist_ok=True)

W, H, FPS = 1080, 1920, 30
POPUP_Y   = 450    # centre Y (zone libre au-dessus du visage, TikTok-style)
POPUP_DUR = 1.5    # secondes
MAX_KW    = 8      # mots-clés maximum à extraire
MIN_GAP   = 8.0    # secondes minimum entre deux apparitions du même mot-clé
GOLD = (255, 200, 70); WHITE = (255, 255, 255)

FR_STOPWORDS = {
    "le","la","les","de","du","des","un","une","à","au","aux","et","ou","en",
    "je","tu","il","elle","nous","vous","ils","elles","mon","ton","son","ma","ta",
    "sa","mes","tes","ses","ce","cet","cette","ces","que","qui","quoi","dont","où",
    "par","pour","sur","sous","dans","avec","sans","mais","car","si","ne","pas",
    "plus","très","bien","tout","tous","toute","toutes","aussi","ça","se","lui",
    "leur","leurs","me","te","on","même","comme","est","sont","être","avoir",
    "fait","faire","peut","va","vais","vont","ai","as","a","avez","avons","ont",
    "voilà","alors","donc","puis","après","avant","pendant","quand","jamais",
    "toujours","souvent","encore","déjà","maintenant","ici","là","cela","c'est",
    "cette","chez","entre","vers","jusque","jusqu","depuis","lors","selon"
}

_fc = {}
def font(size, bold=True):
    key = (size, bold)
    if key not in _fc:
        names = (["DejaVuSans-Bold.ttf","FreeSansBold.ttf","LiberationSans-Bold.ttf"] if bold
                 else ["DejaVuSans.ttf","FreeSans.ttf","LiberationSans-Regular.ttf"])
        for n in names:
            for d in [Path.home()/".fonts",
                      Path("/usr/share/fonts/truetype/dejavu"),
                      Path("/usr/share/fonts/truetype/freefont"),
                      Path("/usr/share/fonts/truetype/liberation")]:
                p = d/n
                if p.exists():
                    _fc[key] = ImageFont.truetype(str(p), size); break
            if key in _fc: break
        if key not in _fc: _fc[key] = ImageFont.load_default()
    return _fc[key]

def eo(t): t=max(0,min(1,t)); return 1-(1-t)**3

def find_vu_json():
    cands = sorted((EDIT/"transcripts").glob("*_vu.json"))
    if not cands: raise FileNotFoundError("No *_vu.json in transcripts/")
    return cands[-1]

def extract_keywords(words):
    freq = Counter()
    for w in words:
        tok = re.sub(r"[^\w]", "", w["text"].lower())
        if len(tok) > 3 and tok not in FR_STOPWORDS:
            freq[tok] += 1
    return [kw for kw, _ in freq.most_common(MAX_KW)]

def map_output(words, edl):
    maps = []; off = 0.0
    for r in edl["ranges"]:
        a, b = float(r["start"]), float(r["end"]); maps.append((a, b, off)); off += b-a
    def s2o(t):
        for a, b, o in maps:
            if a <= t <= b: return o+(t-a)
        return None
    result = []
    for w in words:
        o = s2o(w["start"])
        if o is not None:
            tok = re.sub(r"[^\w\-]", "", w["text"].lower())
            result.append((o, tok))
    return result

def make_popup(keyword, out_path):
    label = keyword.upper()
    n = int(POPUP_DUR * FPS)
    fnt = font(72, bold=True)
    d_test = ImageDraw.Draw(Image.new("RGBA", (W, H)))
    tw = int(d_test.textlength(label, font=fnt))
    chip_w = tw + 80; chip_h = 90
    cx, cy = W//2, POPUP_Y
    fin_a, fout_a = 0.08, 0.12

    cmd = ["ffmpeg","-y","-f","rawvideo","-pix_fmt","rgba","-s",f"{W}x{H}","-r",str(FPS),
           "-i","pipe:0","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",
           "-an", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(n):
        t = i / FPS
        frame = Image.new("RGBA", (W, H), (0,0,0,0))
        d = ImageDraw.Draw(frame)
        sc = eo(min(1.0, t / 0.12))
        a_in  = eo(t / fin_a) if t < fin_a else 1.0
        a_out = eo((POPUP_DUR-t) / fout_a) if t > POPUP_DUR-fout_a else 1.0
        ga = min(a_in, a_out)
        cw2 = max(2, int(chip_w * sc / 2))
        ch2 = max(2, int(chip_h * sc / 2))
        d.rounded_rectangle((cx-cw2, cy-ch2, cx+cw2, cy+ch2), radius=20,
                             fill=(10, 10, 30, int(220*ga*sc)))
        d.rounded_rectangle((cx-cw2, cy-ch2, cx+cw2, cy+ch2), radius=20,
                             outline=(*GOLD, int(255*ga*sc)), width=4)
        d.text((cx - tw/2, cy - 36), label, font=fnt, fill=(*WHITE, int(255*ga)))
        proc.stdin.write(frame.tobytes())
    proc.stdin.close(); proc.wait()
    print(f"  ✓ popup_{keyword}.mov")

def main():
    vu_path = find_vu_json()
    tr  = json.loads(vu_path.read_text())
    edl = json.loads(EDL.read_text())
    words = [w for w in tr["words"] if w.get("type") == "word"]

    keywords = extract_keywords(words)
    mapped   = map_output(words, edl)

    placements = []
    kw_last = {}
    for out_t, tok in sorted(mapped):
        for kw in keywords:
            if tok == kw:
                if out_t - kw_last.get(kw, -99) >= MIN_GAP:
                    placements.append((out_t, kw))
                    kw_last[kw] = out_t
                break

    new_overlays = []
    for t, kw in placements:
        clip_path = OUT / f"popup_{kw}.mov"
        if not clip_path.exists():
            make_popup(kw, clip_path)
        new_overlays.append({
            "file": f"broll_clips/popup_{kw}.mov",
            "start_in_output": max(0.0, round(t - 0.1, 2)),
            "duration": POPUP_DUR
        })

    edl["overlays"] = edl.get("overlays", []) + new_overlays
    EDL.write_text(json.dumps(edl, ensure_ascii=False, indent=2))
    print(f"Keyword popups: {len(placements)} placements ({len(keywords)} mots-clés) -> edl.json patché")
    for t, kw in placements:
        print(f"  {t:6.1f}s  [{kw}]")

if __name__ == "__main__":
    main()
