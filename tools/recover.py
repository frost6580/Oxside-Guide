# -*- coding: utf-8 -*-
"""スキン画像の復元: GUID→実スプライト / マテリアルのテクスチャ / マテリアル色の色見本"""
import UnityPy, glob, os, re, json, sys
from PIL import Image, ImageDraw
SRC, ROOT = sys.argv[1], sys.argv[2]      # Data/Raw/aa/iOS, OXIDE_stats
OUT = os.path.join(ROOT, 'skin_recovered'); os.makedirs(OUT, exist_ok=True)
safe = lambda s: re.sub(r'[\\/:*?"<>|]', '_', s)[:120] or 'noname'
bname = lambda f: re.sub(r'_[0-9a-f]{32}\.bundle$', '', os.path.basename(f))

def sfiles(env):
    st = list(env.files.items())
    while st:
        k, v = st.pop()
        if hasattr(v, 'objects'): yield k.split('/')[-1].lower(), v
        elif hasattr(v, 'files'): st.extend(v.files.items())

def png_for(bundle, typ, name):
    for top in ('images', 'textures_3d'):
        for sub in (('sprites', 'textures') if typ == 'Sprite' else ('textures', 'sprites')):
            p = os.path.join(ROOT, top, safe(bundle), sub, safe(name) + '.png')
            if os.path.exists(p): return p
    return None

matname = {}
guid = {}        # GUID -> [(bundle, type, name, cab, pathid)]
texloc = {}      # (cab, pathid) -> (bundle, name)
envs = {}
files = glob.glob(os.path.join(SRC, '*.bundle'))
print('バンドル走査', len(files), flush=True)
for f in files:
    b = bname(f)
    try: env = UnityPy.load(f)
    except Exception: continue
    for cab, sf in sfiles(env):
        for pid, o in sf.objects.items():
            if o.type.name == 'Material':
                try: matname.setdefault(o.peek_name().lower(), (b, 'Material', o.peek_name(), cab, pid, f))
                except Exception: pass
            elif o.type.name == 'Texture2D':
                try: texloc[(cab, pid)] = (b, o.peek_name())
                except Exception: pass
            elif o.type.name == 'AssetBundle':
                for path, info in o.read_typetree()['m_Container']:
                    t = sf.objects.get(info['asset']['m_PathID'])
                    if t is not None and t.type.name in ('Sprite', 'Texture2D', 'Material'):
                        guid.setdefault(path, []).append((b, t.type.name, t.peek_name(), cab, info['asset']['m_PathID'], f))
print('GUID', len(guid), 'テクスチャ', len(texloc), 'マテリアル', len(matname), flush=True)
RES = json.load(open(os.path.join(ROOT, 'data_json', 'data-items-skins_assets_all.json'), encoding='utf-8'))
resolved = {(v.get('Id') or v.get('m_Name')): v for v in RES.values() if isinstance(v, dict)}

def material_image(entry):
    b, typ, name, cab, pid, f = entry
    env = UnityPy.load(f)
    for c, sf in sfiles(env):
        if c != cab: continue
        o = sf.objects.get(pid)
        if o is None: return None
        t = o.read_typetree()
        ext = [e.path.split('/')[-1].lower() for e in sf.externals]
        props = t.get('m_SavedProperties', {})
        for key, env_ in props.get('m_TexEnvs', []):
            if key not in ('_BaseMap', '_MainTex', '_BaseColorMap', '_Albedo', '_AlbedoMap'): continue
            ref = env_['m_Texture']
            if not ref['m_PathID']: continue
            tc = cab if ref['m_FileID'] == 0 else (ext[ref['m_FileID'] - 1] if ref['m_FileID'] - 1 < len(ext) else '')
            loc = texloc.get((tc, ref['m_PathID']))
            if loc:
                p = png_for(loc[0], 'Texture2D', loc[1])
                if p: return ('texture', p)
        cols = dict((k, v) for k, v in props.get('m_Colors', []))
        for key in ('_BaseColor', '_Color', '_MainColor', '_Tint'):
            if key in cols:
                c = cols[key]
                return ('color', tuple(max(0, min(255, int(round(c[k] * 255)))) for k in ('r', 'g', 'b')))
    return None

def swatch(rgb, path):
    im = Image.new('RGBA', (128, 128), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 8, 120, 120), radius=22, fill=rgb + (255,), outline=(255, 255, 255, 200), width=4)
    im.save(path)

def thumb(src, path):
    im = Image.open(src).convert('RGBA'); im.thumbnail((256, 256)); im.save(path)

# 生データのスキン定義(GUIDのまま)
sk = glob.glob(os.path.join(SRC, 'data-items-skins_assets_all_*.bundle'))[0]
result = {}
stat = {'icon': 0, 'texture': 0, 'color': 0, 'none': 0}
for o in UnityPy.load(sk).objects:
    if o.type.name != 'MonoBehaviour': continue
    t = o.read_typetree()
    sid = t.get('Id') or t.get('m_Name')
    if not sid: continue
    done = None
    for refk in ('iconRef', 'bigImageRef'):
        g = (t.get(refk) or {}).get('m_AssetGUID')
        for e in sorted(guid.get(g, []), key=lambda x: x[1] != 'Sprite'):
            if e[1] in ('Sprite', 'Texture2D'):
                p = png_for(e[0], e[1], e[2])
                if p: done = ('icon', p); break
        if done: break
    if not done:
        g = (t.get('materialRef') or {}).get('m_AssetGUID')
        cands = [e for e in guid.get(g, []) if e[1] == 'Material']
        mn = (resolved.get(sid, {}).get('materialRef') or '').replace('asset:', '').lower()
        if mn in matname: cands.append(matname[mn])
        for e in cands:
            done = material_image(e)
            if done: break
    dst = os.path.join(OUT, safe(sid) + '.png')
    if done and done[0] == 'color': swatch(done[1], dst)
    elif done and done[0] == 'texture': thumb(done[1], dst)
    elif done: thumb(done[1], dst)
    if done:
        result[sid] = {'img': os.path.relpath(dst, ROOT).replace('\\', '/'), 'src': done[0]}
        stat[done[0]] += 1
    else: stat['none'] += 1
json.dump(result, open(os.path.join(OUT, 'map.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('結果', stat)
