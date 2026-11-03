# -*- coding: utf-8 -*-
import json, csv, os, re, glob, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja import JA, CAT, CAT_ORDER, DT, ANIMAL, STATE, CFG_JA, voucher_ja
import ja_keys as K

ROOT = sys.argv[1]                      # OXIDE_stats
OUT = os.path.join(ROOT, 'site')
TPL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tpl')
J = os.path.join(ROOT, 'data_json')

def L(name):
    d = json.load(open(os.path.join(J, name + '.json'), encoding='utf-8'))
    d.pop('__guid_resolved', None); return d
def C(name):
    return list(csv.DictReader(open(os.path.join(ROOT, name + '.csv'), encoding='utf-8-sig')))
ref = lambda s: re.sub(r' \((MonoBehaviour|MonoScript)\)$', '', s) if isinstance(s, str) else s
def num(x):
    try:
        f = float(x); return int(f) if f.is_integer() else round(f, 4)
    except Exception: return x

# ---------- アイテム ----------
raw_items = {v['m_ShortName']: v for v in L('data-items-dataso_assets_all').values() if isinstance(v, dict) and 'm_ShortName' in v}
recipes = L('data-items-recipes_assets_all')
burns = L('data-items-burnresults_assets_all')
prots = L('data-items-protection_assets_all')
mods_raw = L('data-weapons-mods_assets_all')
loot_raw = L('data-loot-items_assets_all')
items_csv = {r['short_name']: r for r in C('items_all')}
tech = C('techtree')
weapons = {r['short_name']: r for r in C('weapons')}
wmods = {r['short_name']: r for r in C('weapon_mods')}

def ja(s): return voucher_ja(s) if s.startswith('skin.vaucher.') else JA.get(s, s)

os.makedirs(os.path.join(OUT, 'img', 'items'), exist_ok=True)
items = {}
for sn, v in raw_items.items():
    c = items_csv.get(sn, {})
    icon = ''
    src = os.path.join(ROOT, 'item_icons', sn + '.png')
    if os.path.exists(src):
        shutil.copy(src, os.path.join(OUT, 'img', 'items', sn + '.png')); icon = 'img/items/' + sn + '.png'
    rc = recipes.get(ref(v.get('recipeConfig'))) if v.get('recipeConfig') not in (None, 'None') else None
    br = burns.get(ref(v.get('burnResult'))) if v.get('burnResult') not in (None, 'None') else None
    pr = prots.get(ref(v.get('protection'))) if v.get('protection') not in (None, 'None') else None
    md = mods_raw.get(ref(v.get('weaponModConfig'))) if v.get('weaponModConfig') not in (None, 'None') else None
    cfg = v.get('m_ConfigValues') or {}
    it = {
        'id': sn, 'ja': ja(sn), 'en': v.get('m_DisplayName') if v.get('m_DisplayName') not in (None, '', sn) else '',
        'cat': v.get('m_Category'), 'icon': icon, 'num_id': num(v.get('m_Id')), 'stack': num(v.get('m_StackSize')),
        'craftable': v.get('m_IsCraftable') == 1, 'buildable': v.get('m_IsBuildable') == 1, 'blueprint': v.get('m_HasBlueprint') == 1,
        'store': v.get('m_StoreItem') == 1, 'vehicle': v.get('m_IsVehicle') == 1, 'level': num(v.get('m_levelToOpen')),
        'clan_perk': num(v.get('m_RequiredClanPerk')), 'can_mods': v.get('canUseMods') == 1,
        'group': ref(v.get('group')), 'subtype': ref(v.get('subType')),
        'price': (v.get('m_Purchase') or {}).get('m_Price'), 'price_amount': (v.get('m_Purchase') or {}).get('m_Amount'),
        'skins': [ref(s).replace('_SkinData', '') for s in (v.get('skinData') or []) if s],
        'cfg': {k: num(x) for k, x in cfg.items() if x not in (0, '', None, 0.0)},
        'recipe': None, 'recycle': [], 'burn': None, 'prot': None, 'mod': None,
        'backpack': ref(v.get('backpackConfig')) if v.get('backpackConfig') not in (None, 'None') else '',
    }
    if rc:
        it['recipe'] = {'time': rc['craftDuration'], 'count': rc['craftedCount'],
                        'items': [[x['m_Name'], x['m_Amount']] for x in rc['requiredItems']]}
        it['recycle'] = [[x['m_Name'], x['m_Amount'], round((1 - x.get('m_SkipChance', 0)) * 100)] for x in rc['itemsFromRecycle']]
    if br:
        it['burn'] = [[x['item'], x['amount']] for x in br['items']]
    if pr:
        it['prot'] = {'density': num(pr['density']), 'v': [round(x, 3) for x in pr['amounts']]}
    if md:
        it['mod'] = wmods.get(sn, {}).get('effects', '')
    items[sn] = it

# 逆引き: 素材として使用 / リサイクル入手 / 焼成入手
for sn, it in items.items():
    it['used_in'] = []; it['from_recycle'] = []; it['from_burn'] = []
for sn, it in items.items():
    if it['recipe']:
        for m, a in it['recipe']['items']:
            if m in items: items[m]['used_in'].append([sn, a])
    for m, a, p in it['recycle']:
        if m in items: items[m]['from_recycle'].append([sn, a, p])
    for m, a in (it['burn'] or []):
        if m in items: items[m]['from_burn'].append([sn, a])

# テックツリー
name2sn = {}
for sn, v in raw_items.items():
    dn = v.get('m_DisplayName')
    if isinstance(dn, str): name2sn.setdefault(dn, sn)
techlist = []
for r in tech:
    sn = r['item']
    techlist.append({'lv': num(r['level']), 'id': sn, 'cost': num(r['cost']), 'req': [x.strip() for x in r['requires'].split(',') if x.strip()]})
    if sn in items: items[sn]['tech'] = {'lv': num(r['level']), 'cost': num(r['cost'])}

# ルート
loot = {}
for k, v in loot_raw.items():
    if not isinstance(v, dict) or 'items' not in v: continue
    loot[v['m_Name']] = {
        'items': [[x['item'], x['amount']] for x in v['items']],
        'sub': [[ref(x['category']), num(x['probability']), x['spawnMethod']] for x in v['subSpawn']],
        'random': v.get('random'), 'min': v.get('minSpawnCount'), 'max': v.get('maxSpawnCount'),
        'oneRandom': v.get('oneRandomItems'), 'skipSame': v.get('skipSame'), 'scale': num(v.get('probabilityScaleFactor')),
    }
parents = {}
for n, t in loot.items():
    for s, p, m in t['sub']: parents.setdefault(s, []).append([n, p])
for n, t in loot.items():
    for sn, a in t['items']:
        if sn in items: items[sn].setdefault('loot', []).append([n, a, parents.get(n, [])])

# 武器
wlist = []
for sn, r in weapons.items():
    d = {k: num(x) for k, x in r.items() if k not in ('recipe', 'recycle', 'name')}
    d['ja'] = ja(sn); d['mods'] = [('weapon.mod.' + m.strip()) for m in r.get('mods', '').split(',') if m.strip()]
    wlist.append(d)
    if sn in items: items[sn]['weapon'] = d

# ---------- モブ ----------
animals = C('animals'); states = C('animal_states')
mobimg = {'Bear': 'BearBrown_AlbedoSmoothness', 'Boar': 'Boar_Male_Albedo1', 'Deer': 'Red_Deer_Albedo1'}
os.makedirs(os.path.join(OUT, 'img', 'mobs'), exist_ok=True)
texdir = os.path.join(ROOT, 'textures_3d')
alltex = {os.path.splitext(os.path.basename(p))[0].lower(): p for p in glob.glob(texdir + '/**/textures/*.png', recursive=True)}
def find_tex(key):
    if key in mobimg and mobimg[key].lower() in alltex: return alltex[mobimg[key].lower()]
    k = key.split('_')[0].lower()
    cands = sorted(p for n, p in alltex.items() if n.startswith(k) and ('albedo' in n or 'basecolor' in n or 'diffuse' in n))
    return cands[0] if cands else None
mobs = []
for a in animals:
    nm = a['animal']; img = ''
    p = find_tex(nm)
    alt = False
    if not p:
        p = os.path.join(ROOT, 'images', 'ui-gameplay_assets_all', 'sprites', 'ico_animals.png'); alt = True
    if p and os.path.exists(p):
        dst = os.path.join(OUT, 'img', 'mobs', nm + '.png'); shutil.copy(p, dst); img = 'img/mobs/' + nm + '.png'
    st = []
    base = nm.replace('_Leader', '')
    for s in states:
        if s['state'].startswith(nm if nm != 'Wolf' else 'Wolf') and (nm == 'Wolf_Leader' or not s['state'].startswith('Wolf_Leader')):
            if not s['state'].startswith(nm): continue
            sname = s['state'][len(nm):].lstrip('_')
            st.append({'state': sname, 'ja': STATE.get(sname, sname), 'tr': s['transitions'], 'params': s['params']})
    mobs.append({'id': nm, 'ja': ANIMAL.get(nm, nm), 'img': img, 'alt': alt, 'stats': {k: num(x) for k, x in a.items() if k != 'animal'}, 'states': st})
npc_eq = C('npc_equipment')

# ---------- その他 ----------
core = L('data-core-local_assets_all')
def strip(o):
    if isinstance(o, dict):
        return {re.sub(r'^<(.*)>k__BackingField$', r'\1', k): strip(x) for k, x in o.items()
                if k not in ('m_Script', 'm_Name') and not (isinstance(x, str) and x.startswith('asset:'))}
    if isinstance(o, list): return [strip(x) for x in o]
    return num(o) if isinstance(o, float) else o
world_keys = ['AirdropConfig', 'AirdropFleetEventConfig', 'PatrolHeliConfig', 'ParachuteConfig', 'AimAssistConfig',
              'CandyEffectsConfig', 'ValentineEventShopConfig', 'ResourcesVaultNetworkObjectConfig', 'WorldStreamingConfig',
              'MapNamesInfo', 'TeammateColorsConfig', 'ClanmateColorsConfig', 'PickupZoneCategoryOrder', 'BuildingCategoriesConfig']
world = {k: strip(core[k]) for k in world_keys if k in core}
filters = {k: strip(v) for k, v in core.items() if k.endswith('_filter')}
for f in ('RedMoonConfigSO', 'FoggyNightConfigSO'):
    if f in core: world[f] = strip(core[f])
levels = [{k: num(x) for k, x in r.items()} for r in C('player_levels')]
def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if v not in (None, [], {}, '')}
    if isinstance(o, list): return [clean(v) for v in o]
    return num(o) if isinstance(o, float) else o
spawns = []
for r in C('spawn_populations'):
    d = {k: num(x) for k, x in r.items() if k != 'other'}
    d['other'] = clean(json.loads(r['other'])) if r.get('other') else {}
    spawns.append(d)
def to_ids(txt):
    out = []
    for t in [x.strip() for x in (txt or '').split(',') if x.strip()]:
        out.append(t if t in raw_items else name2sn.get(t, t))
    return out
quests = [{'group': K.QUEST.get(r['group'], r['group']), 'step': num(r['step']), 'type': K.QUEST_TYPE.get(r['quest_type'], r['quest_type']),
           'quest': K.QUEST.get(r['quest'], r['quest']), 'target': to_ids(r['target']), 'progress': num(r['progress']), 'unlocks': to_ids(r['unlocks'])}
          for r in C('tutorial_quests')]
missions = [{'mission': r['mission'], 'ja': K.MISSION.get(r['mission'], r['mission']), 'item': r['item'], 'count': num(r['count']),
             'task': K.MISSION_TASK.get(r['task'], r['task'])} for r in C('missions')]
biome = C('biome_lighting')

# スキン
skins_raw = L('data-items-skins_assets_all')
os.makedirs(os.path.join(OUT, 'img', 'skins'), exist_ok=True)
skdir = os.path.join(ROOT, 'images', 'ui-skinitems-local_assets_all', 'sprites')
skfiles = {os.path.splitext(f)[0].lower(): f for f in os.listdir(skdir)} if os.path.isdir(skdir) else {}
rp = os.path.join(ROOT, 'skin_recovered', 'map.json')
RECOV = json.load(open(rp, encoding='utf-8')) if os.path.exists(rp) else {}
skins = []
for k, v in skins_raw.items():
    if not isinstance(v, dict): continue
    sid = v.get('Id') or v['m_Name']; img = ''
    ic = (v.get('iconRef') or '').replace('asset:', '').lower()
    f = skfiles.get(ic) or skfiles.get((sid + '_icon').lower())
    src = ''
    if f:
        shutil.copy(os.path.join(skdir, f), os.path.join(OUT, 'img', 'skins', f)); img = 'img/skins/' + f; src = 'icon'
    elif sid in RECOV:
        fn = os.path.basename(RECOV[sid]['img'])
        shutil.copy(os.path.join(ROOT, RECOV[sid]['img']), os.path.join(OUT, 'img', 'skins', fn)); img = 'img/skins/' + fn
        src = {'icon': 'icon', 'texture': 'texture', 'color': 'color'}[RECOV[sid]['src']]
    else:
        base = v.get('baseId') or ''
        if base in items and items[base]['icon']: img = items[base]['icon']; src = 'alt'
    kind = ref(v.get('m_Script', '')).replace(' (MonoScript)', '').replace('MonoScript', '')
    skins.append({'id': sid, 'base': v.get('baseId') or '', 'kind': kind, 'img': img, 'src': src})
skin_img = {s['id']: s for s in skins}
# アイコンの無いアイテムに代替画像
def copy_alt(p, sn):
    if p and os.path.exists(p):
        shutil.copy(p, os.path.join(OUT, 'img', 'items', sn + '.png')); items[sn]['icon'] = 'img/items/' + sn + '.png'; items[sn]['iconAlt'] = True
ICON = os.path.join(ROOT, 'images', 'ui-iconitems_assets_all', 'sprites')
for sn, it in items.items():
    if it['icon']: continue
    if sn.startswith('skin.vaucher.skin.'):
        s = skin_img.get('skin.' + sn[len('skin.vaucher.skin.'):].replace('skin.', '', 1)) or skin_img.get(sn[len('skin.vaucher.'):])
        if s and s['img']:
            p = os.path.join(OUT, s['img']); copy_alt(p, sn); it['iconAlt'] = s['src'] == 'alt' or s['src'] != 'icon'
    elif sn.startswith('f2p.lootbox.'):
        copy_alt(os.path.join(ICON, 'lootbox.f2t.' + sn.split('.')[-1] + '.png'), sn); it['iconAlt'] = False
    elif sn == 'fn.fal':
        s = next((x for x in skins if x['base'] == 'fn.fal' and x['src'] == 'icon'), None)
        if s: copy_alt(os.path.join(OUT, s['img']), sn)
    elif sn == 'sticker':
        s = next((x for x in skins if x['base'] == 'sticker' and x['src'] == 'icon'), None)
        if s: copy_alt(os.path.join(OUT, s['img']), sn)
    elif sn == 'xmas.advent':
        copy_alt(os.path.join(OUT, items['storage.box']['icon']) if items.get('storage.box', {}).get('icon') else None, sn)
# 2回目: ベースの代替画像をスキン・引換券へ反映
for s in skins:
    if not s['base'] and s['id'].endswith('_RecolorSkin'): s['base'] = s['id'][:-len('_RecolorSkin')]
    if not s['img'] and s['base'] in items and items[s['base']]['icon']:
        s['img'] = items[s['base']]['icon']; s['src'] = 'alt'
for sn, it in items.items():
    if not it['icon'] and sn.startswith('skin.vaucher.skin.'):
        s = skin_img.get('skin.' + sn[len('skin.vaucher.skin.'):].replace('skin.', '', 1))
        if s and s['img']: it['icon'] = s['img']; it['iconAlt'] = True

DATA = {
    'meta': {'version': '1.17.1179', 'items': len(items)},
    'items': items, 'cat': CAT, 'catOrder': CAT_ORDER, 'dt': DT, 'cfgJa': CFG_JA,
    'tech': techlist, 'weapons': wlist, 'mods': list(wmods.values()), 'loot': loot,
    'mobs': mobs, 'npcEq': npc_eq, 'missions': missions, 'world': world, 'filters': filters,
    'extraJa': {'44.bullet':'.44マグナム弾(旧ID)','556.bullet':'5.56mm弾(旧ID)','shell':'散弾(旧ID)'},
    'keyJa': K.KEY, 'stateKey': K.STATE_KEY, 'trigger': K.TRIGGER, 'val': K.VAL, 'group': K.GROUP, 'npcJa': K.NPC, 'token': K.TOKEN, 'stateJa': STATE,
    'levels': levels, 'spawns': spawns, 'quests': quests, 'biome': biome, 'skins': skins,
}
with open(os.path.join(OUT, 'data.js'), 'w', encoding='utf-8') as fp:
    fp.write('window.DATA=' + json.dumps(DATA, ensure_ascii=False, separators=(',', ':')) + ';')
for f in os.listdir(TPL):
    shutil.copy(os.path.join(TPL, f), os.path.join(OUT, f))
print('アイテム', len(items), '武器', len(wlist), 'モブ', len(mobs), 'スキン', len(skins), 'スキン画像', sum(1 for s in skins if s['img']),
      'ルート表', len(loot), 'モブ画像', sum(1 for m in mobs if m['img']))
