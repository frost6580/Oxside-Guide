(function(){
'use strict';
const D = window.DATA, I = D.items, M = document.getElementById('main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = v => (typeof v === 'number') ? (Number.isInteger(v) ? v.toLocaleString() : (+v.toFixed(3)).toString()) : esc(v);
const nm = id => I[id] ? I[id].ja : (D.extraJa[id] || id);
const cat = c => D.cat[c] || c || '-';
const DT_MAIN = [9,10,11,15,14,16,21,3,13,5];

// ---------- 部品 ----------
function itemLink(id, amt, extra){
  const it = I[id];
  const img = it && it.icon ? `<img src="${it.icon}" alt="" loading="lazy">` : '';
  const a = amt != null ? ` <span class="x">×${fmt(amt)}</span>` : '';
  return `<a class="it" href="#/item/${encodeURIComponent(id)}">${img}${esc(nm(id))}${a}${extra||''}</a>`;
}
const itemList = (arr) => arr && arr.length ? arr.map(([id,a]) => itemLink(id,a)).join('') : '<span class="muted">-</span>';
function card(it){
  const img = it.icon ? `<img src="${it.icon}" alt="" loading="lazy">` : `<div class="noimg">画像なし</div>`;
  const badge = it.iconAlt ? '<span class="badge" title="元画像が未同梱のため代わりの画像を表示">代替画像</span>' : '';
  return `<a class="card" href="#/item/${encodeURIComponent(it.id)}">${badge}${img}<div class="n">${esc(it.ja)}</div><div class="e">${esc(it.id)}</div></a>`;
}
// ---------- 日本語化 ----------
const vn = s => `<small class="vn">${esc(s)}</small>`;           // 小さい変数名/ID
const jaKey = k => D.keyJa[k] || D.cfgJa[k] || D.stateKey[k] || D.cat[k] || k;
function jaPath(p){
  return p.split('.').map(seg => {
    const m = seg.match(/^(.*?)((\[\d+\])*)$/);
    const idx = (m[2] || '').replace(/\[(\d+)\]/g, (_,n) => ` #${+n+1}`);
    return jaKey(m[1]) + idx;
  }).join(' › ');
}
const KIND = {Sprite:'画像', Texture2D:'画像', AudioClip:'効果音', MonoBehaviour:'', MonoScript:''};
const LOOT_SP = {MilitaryBox:'軍用ボックス', Ammo_Random:'弾薬(ランダム)', Firearm_Random:'銃(ランダム)', Food_Random:'食料(ランダム)', Tools:'ツール',
  InitialTools:'初期ツール', Resources:'資源', Ammo:'弾薬', AmmoBig:'弾薬(大)', AmmoSuperBig:'弾薬(特大)', hackerLoot:'ハッカーの報酬', CandyCane:'キャンディケイン',
  'Event.Candy':'イベントキャンディ', 'Event.HeartFragment':'ハートの欠片', 'Event.HeartFragmentForGiftBox':'ハートの欠片(ギフト用)', HalloweenCandy:'ハロウィンキャンディ',
  HalloweenCandyMystery:'ミステリーキャンディ', 'F2P.Epic':'ルートボックス(エピック)', 'F2P.Legendary':'ルートボックス(レジェンダリー)', 'F2P.Rare':'ルートボックス(レア)',
  'Event.Easter.Egg':'イースターエッグ', 'bp.harddrive':'設計図:ハードドライブ', 'bp.microprocessor':'設計図:マイクロプロセッサ', 'bp.wires':'設計図:ケーブル',
  'militarybase.keycard':'軍事基地カードキー', 'plane.keycard':'機長のカードキー', cookedmeat:'焼き肉', stone_gates:'高い石の門', stone_wall:'高い石の壁',
  wooden_gate:'高い木の門', wooden_wall:'高い木の壁', 'wooden.bow_and_arrow':'木の弓と矢', 'wooden.crossbow_and_bolt':'クロスボウとボルト', 'scrap_random_barrel':'スクラップ(樽)',
  'event.currency.hard':'イベント通貨(ハード)', 'event.currency.soft.group':'イベント通貨(ソフト)抽選', 'mini.bp.exp.item.group':'BP経験値 抽選',
  'halloween_loot_rotten.meat':'腐った肉(ハロウィン)', 'bp.exp.itembp.exp.item':'BP経験値'};
function lootJa(n){
  if (LOOT_SP[n]) return LOOT_SP[n];
  let s = n.replace(/^(EST_Loot\.|Loot\.|LootSpawn\.)/, '');
  if (LOOT_SP[s]) return LOOT_SP[s] + (n.startsWith('EST_') ? '(拠点)' : '');
  let suf = '', m;
  if ((m = s.match(/^(.*)_x(\d+)$/)) || (m = s.match(/^(.*)_(\d+)$/))) { s = m[1]; suf = ` ×${m[2]}`; }
  else if ((m = s.match(/^(.*)_random(\d+)$/))) { s = m[1]; suf = ` ×1〜${m[2]}`; }
  else if ((m = s.match(/^(.*)_(legendary|red|violet)$/))) { s = m[1]; suf = {legendary:'(レジェンダリー)',red:'(赤)',violet:'(紫)'}[m[2]]; }
  else if ((m = s.match(/^(.*)_drop_(one|two)( 1)?$/))) { s = m[1].replace('halloween_loot_',''); suf = m[2]==='one'?' ×1':' ×2'; }
  else if ((m = s.match(/^event\.currency\.soft_(\d+)$/))) return `イベント通貨(ソフト) ×${m[1]}`;
  if (I[s]) return nm(s) + suf + (n.startsWith('EST_') ? '(拠点)' : '');
  return null;
}
const lootLabel = n => { const j = lootJa(n); return j ? `${esc(j)} ${vn(n)}` : `<code>${esc(n)}</code>`; };
const lootLink = n => `<a href="#/loot/${encodeURIComponent(n)}">${lootLabel(n)}</a>`;
function tokJa(n){
  const parts = n.split('_'); let known = 0;
  const out = parts.map(p => { if (p in D.token) { known++; return D.token[p]; } return p; }).filter(Boolean);
  return known === parts.length ? out.join(' ') : null;
}
function spawnJa(n){
  if (D.val[n]) return D.val[n];
  if (n.startsWith('npc_')) { const k = n.slice(4); return 'NPC:' + (D.token[k] || k); }
  if (n.startsWith('event.rose')) return 'バラ(イベント)';
  if (n === 'temp_forest') return '温帯の森';
  return tokJa(n);
}
function npcJa(n){
  const [a,b] = n.split('_'); const x = D.npcJa[a] || a;
  return b ? `${x}・${D.npcJa[b] || b}` : x;
}
// 値の日本語化
function tv(v){
  if (Array.isArray(v)) return v.length ? v.map(tv).join('、') : '<span class="muted">なし</span>';
  if (typeof v === 'number') return fmt(v);
  if (typeof v === 'boolean') return v ? 'はい' : 'いいえ';
  if (typeof v !== 'string') return fmt(v);
  if (v === '') return '<span class="muted">-</span>';
  const m = v.match(/^(.*) \((Sprite|Texture2D|AudioClip|MonoBehaviour|MonoScript)\)$/);
  if (m) { const inner = tv(m[1]); return KIND[m[2]] ? `${KIND[m[2]]}: ${inner}` : inner; }
  if (I[v]) return itemLink(v);
  if (D.val[v]) return esc(D.val[v]);
  if (D.cat[v]) return esc(D.cat[v]);
  if (D.group[v]) return esc(D.group[v]);
  if (D.loot[v]) return lootLink(v);
  if (/^#[0-9A-F]{6}/i.test(v) || !/[A-Za-z]/.test(v)) return esc(v);
  return `<code>${esc(v)}</code>`;
}
// rows = [[日本語名, 変数名, 値]]
function kvRows(rows){
  return `<div class="tw"><table><thead><tr><th>項目</th><th>値</th></tr></thead><tbody>${
    rows.map(([j,k,v]) => `<tr><td>${esc(j)}${k && k !== j ? vn(k) : ''}</td><td>${tv(v)}</td></tr>`).join('')}</tbody></table></div>`;
}
// ソート可能テーブル: cols=[{h, v:row=>値(ソート用), r:row=>HTML, num}]
function table(cols, rows, id){
  id = id || 't' + Math.random().toString(36).slice(2);
  setTimeout(() => bindSort(id, cols, rows), 0);
  return `<div class="tw"><table id="${id}">${thead(cols)}<tbody>${tbody(cols, rows)}</tbody></table></div>`;
}
const thead = cols => '<thead><tr>' + cols.map((c,i) => `<th data-i="${i}">${c.h}</th>`).join('') + '</tr></thead>';
const tbody = (cols, rows) => rows.map(r => '<tr>' + cols.map(c => {
  const v = c.r ? c.r(r) : fmt(c.v(r));
  return `<td${c.num ? ' class="num"' : ''}>${v ?? ''}</td>`;
}).join('') + '</tr>').join('');
function bindSort(id, cols, rows){
  const t = document.getElementById(id); if (!t) return;
  let si = -1, dir = 1;
  t.querySelectorAll('th').forEach(th => th.onclick = () => {
    const i = +th.dataset.i; dir = (si === i) ? -dir : 1; si = i;
    const f = cols[i].v || (r => '');
    const sorted = rows.slice().sort((a,b) => {
      let x = f(a), y = f(b);
      const nx = parseFloat(x), ny = parseFloat(y);
      if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * dir;
      return String(x ?? '').localeCompare(String(y ?? ''), 'ja') * dir;
    });
    t.querySelector('tbody').innerHTML = tbody(cols, sorted);
    t.querySelectorAll('th').forEach(h => h.className = '');
    th.className = dir > 0 ? 's-asc' : 's-desc';
  });
}
function kvTable(obj, prefix){
  const rows = [];
  (function walk(o, p){
    if (o && typeof o === 'object' && !Array.isArray(o)) { for (const k in o) walk(o[k], p ? p + '.' + k : k); }
    else if (Array.isArray(o) && o.length && typeof o[0] === 'object') o.forEach((x,i) => walk(x, `${p}[${i}]`));
    else rows.push([jaPath(p), p, o]);
  })(obj, prefix || '');
  return kvRows(rows);
}
const pct = v => v ? `${Math.round(v*100)}%` : '<span class="muted">0</span>';
function filterBox(ph, onInput){
  setTimeout(() => { const el = document.getElementById('flt'); if (el) el.oninput = () => onInput(el.value.trim().toLowerCase()); }, 0);
  return `<input id="flt" class="filter" placeholder="${ph}">`;
}
const match = (it, q) => !q || [it.ja, it.en, it.id].some(s => s && String(s).toLowerCase().includes(q));

// ---------- ページ ----------
const P = {};
P[''] = () => {
  const n = Object.keys(I).length;
  const withRecipe = Object.values(I).filter(x => x.recipe).length;
  return `<h1>OXIDE: Survival Island 攻略データベース</h1>
  <p class="sub">ゲーム内部データ(v${esc(D.meta.version)})から抽出したパラメータを日本語でまとめた非公式データベースです。</p>
  <div class="stats">
    <div class="stat"><b>${n}</b><span>アイテム</span></div>
    <div class="stat"><b>${withRecipe}</b><span>クラフトレシピ</span></div>
    <div class="stat"><b>${D.weapons.length}</b><span>武器</span></div>
    <div class="stat"><b>${D.tech.length}</b><span>テックツリー項目</span></div>
    <div class="stat"><b>${D.mobs.length}</b><span>モブ(動物)</span></div>
    <div class="stat"><b>${Object.keys(D.loot).length}</b><span>ルートテーブル</span></div>
    <div class="stat"><b>${D.spawns.length}</b><span>スポーン設定</span></div>
    <div class="stat"><b>${D.skins.length}</b><span>スキン</span></div>
  </div>
  <h2>カテゴリから探す</h2>
  <div class="tabs">${D.catOrder.map(c => `<button onclick="location.hash='#/items/${encodeURIComponent(c)}'">${cat(c)}</button>`).join('')}</div>
  <h2>主要素材</h2>
  <div class="grid">${['log','stone','metal.ore','metal.fragment','sulfur.ore','sulfur','hq.metal.ore','hq.metal','cloth','leather','scrap','gun.powder','coal','fat.animal','bone','tech.trash'].filter(x=>I[x]).map(x=>card(I[x])).join('')}</div>
  <div class="note">上部の検索欄では、日本語名・英語名・内部名(例: <code>assault.rifle</code>)で全アイテムを検索できます。表の見出しをクリックすると並べ替えができます。</div>`;
};

P.items = (c) => {
  c = c ? decodeURIComponent(c) : 'all';
  let q = '';
  const render = () => {
    const list = Object.values(I).filter(it => (c === 'all' || it.cat === c) && match(it, q))
      .sort((a,b) => D.catOrder.indexOf(a.cat) - D.catOrder.indexOf(b.cat) || a.ja.localeCompare(b.ja,'ja'));
    document.getElementById('ig').innerHTML = list.map(card).join('') || '<p class="muted">該当なし</p>';
    document.getElementById('cnt').textContent = list.length + '件';
  };
  setTimeout(render, 0);
  return `<h1>アイテム一覧</h1><p class="sub">全${Object.keys(I).length}アイテム。カードをクリックすると詳細パラメータを表示します。</p>
  <div class="tabs"><button class="${c==='all'?'on':''}" onclick="location.hash='#/items'">すべて</button>${
    D.catOrder.map(k => `<button class="${c===k?'on':''}" onclick="location.hash='#/items/${encodeURIComponent(k)}'">${cat(k)}</button>`).join('')}</div>
  ${filterBox('名前で絞り込み', v => { q = v; render(); })} <span id="cnt" class="muted"></span>
  <div id="ig" class="grid"></div>`;
};

P.item = (id) => {
  id = decodeURIComponent(id); const it = I[id];
  if (!it) return `<h1>見つかりません</h1><p>${esc(id)}</p>`;
  const flags = [it.craftable&&'クラフト可', it.buildable&&'建築物', it.blueprint&&'設計図あり', it.store&&'ストア商品', it.vehicle&&'乗り物', it.can_mods&&'MOD装着可'].filter(Boolean);
  let h = `<div class="detail-head">${it.icon ? `<img class="big" src="${it.icon}" alt="">` : '<div class="noimg big">画像は<br>アプリ未同梱</div>'}
  <div><h1>${esc(it.ja)}</h1><p class="sub"><code>${esc(it.id)}</code>${it.iconAlt ? ' <span class="badge" style="position:static">代替画像</span>' : ''}</p>
  <dl class="kv">
   <dt>カテゴリ</dt><dd><a href="#/items/${encodeURIComponent(it.cat)}">${cat(it.cat)}</a></dd>
   <dt>内部ID</dt><dd>${fmt(it.num_id)}</dd>
   <dt>スタック数</dt><dd>${fmt(it.stack)}</dd>
   ${it.tech ? `<dt>研究</dt><dd>テックツリー Lv${it.tech.lv} / コスト ${fmt(it.tech.cost)}</dd>` : ''}
   ${it.level ? `<dt>解放レベル</dt><dd>${fmt(it.level)}</dd>` : ''}
   ${it.price ? `<dt>購入価格</dt><dd>${fmt(it.price)}(${fmt(it.price_amount)}個)</dd>` : ''}
   ${it.clan_perk ? `<dt>必要クランパーク</dt><dd>${fmt(it.clan_perk)}</dd>` : ''}
   ${it.backpack ? `<dt>バックパック設定</dt><dd>${tv(it.backpack)}${vn(it.backpack)}</dd>` : ''}
   <dt>グループ</dt><dd>${esc(D.group[it.group]||it.group||'-')} / ${esc(D.group[it.subtype]||it.subtype||'-')}</dd>
   <dt>属性</dt><dd>${flags.map(f=>`<span class="tag a">${f}</span>`).join('') || '-'}</dd>
  </dl></div></div>`;
  h += '<div class="cols">';
  if (it.recipe) h += `<div class="box"><h3>クラフトレシピ</h3><p>${itemList(it.recipe.items)}</p><dl class="kv"><dt>製作時間</dt><dd>${fmt(it.recipe.time)}秒</dd><dt>完成個数</dt><dd>${fmt(it.recipe.count)}</dd></dl></div>`;
  if (it.recycle.length) h += `<div class="box"><h3>リサイクル還元</h3><p>${it.recycle.map(([m,a,p]) => itemLink(m,a, p<100?` <span class="x">(${p}%)</span>`:'')).join('')}</p></div>`;
  if (it.burn) h += `<div class="box"><h3>焼成結果</h3><p>${itemList(it.burn)}</p></div>`;
  if (it.mod) h += `<div class="box"><h3>MOD効果</h3><p>${esc(it.mod)}</p></div>`;
  h += '</div>';
  if (it.weapon) {
    const w = it.weapon;
    const yn = b => b ? 'はい' : 'いいえ';
    h += `<h2>武器性能</h2>` + kvRows([
      ['使用弾薬','ammo',w.ammo||''],['装弾数','mag',w.mag],['ダメージ','damage',w.damage],['ペレット数','pellets',w.pellets],
      ['連射速度(毎分)','rpm',w.rpm],['理論DPS','dps',w['dps(理論)']],['距離減衰','falloff',w.falloff],['最大射程','max_range',w.max_range],
      ['弾速','bullet_speed',w.bullet_speed],['弾の重力','gravity',w.gravity],['リロード(秒)','reload_s',w.reload_s],['1発ずつ装填','loop_reload',yn(w.loop_reload)],
      ['基本拡散','base_disp',w.base_disp],['機動性','mobility',w.mobility],['不発率','misfire',w.misfire],['サプレッサー内蔵','suppressed',yn(w.suppressed)],
      ['拡散設定','disp_cfg',w.disp_cfg],['射撃ごとの拡散増加','disp_per_shot',w.disp_per_shot],['最大拡散','disp_max_fire',w.disp_max_fire],
      ['反動設定','recoil_cfg',w.recoil_cfg],['縦反動','recoil_v',w.recoil_v],['横反動','recoil_h',w.recoil_h],['耐久値','durability',w.durability]]);
    if (w.mods.length) h += `<p>装着可能MOD: ${w.mods.map(m => itemLink(m)).join('')}</p>`;
  }
  if (it.prot) {
    h += `<h2>防護値</h2><p class="muted">ダメージ軽減率(密度 ${fmt(it.prot.density)})。種別名は内部の並び順からの推定です。</p>
    <div class="tw"><table><thead><tr>${it.prot.v.map((_,i)=>`<th>${D.dt[i]}</th>`).join('')}</tr></thead><tbody><tr>${it.prot.v.map(v=>`<td class="num">${pct(v)}</td>`).join('')}</tr></tbody></table></div>`;
  }
  if (it.used_in.length) h += `<h2>素材として使われるレシピ(${it.used_in.length})</h2><p>${it.used_in.sort((a,b)=>nm(a[0]).localeCompare(nm(b[0]),'ja')).map(([s,a]) => itemLink(s, null, ` <span class="x">(${fmt(a)}個使用)</span>`)).join('')}</p>`;
  const src = [];
  if (it.from_recycle.length) src.push(`<div class="box"><h3>リサイクルで入手</h3><p>${it.from_recycle.map(([s,a,p]) => itemLink(s, null, ` <span class="x">→${a}個${p<100?` (${p}%)`:''}</span>`)).join('')}</p></div>`);
  if (it.from_burn.length) src.push(`<div class="box"><h3>焼成で入手</h3><p>${it.from_burn.map(([s,a]) => itemLink(s, null, ` <span class="x">→${a}個</span>`)).join('')}</p></div>`);
  if (it.loot) src.push(`<div class="box"><h3>ルートテーブル</h3><ul class="tree">${it.loot.map(([t,a,par]) =>
    `<li>${lootLink(t)} ×${fmt(a)}${par.length ? ' <span class="muted">← ' + par.map(([p,pr]) => `${lootLink(p)} ${fmt(pr)}%`).join('、') + '</span>' : ''}</li>`).join('')}</ul></div>`);
  if (src.length) h += `<h2>入手方法</h2><div class="cols">${src.join('')}</div>`;
  if (Object.keys(it.cfg).length) {
    h += `<h2>内部パラメータ</h2>` + kvRows(Object.keys(it.cfg).map(k => [D.cfgJa[k]||k, k,
      /^(can|is|has|hides|durabilityUnbreakable|spawnLoaded|disable)/.test(k) && it.cfg[k] === 1 ? 'はい' : it.cfg[k]]));
  }
  if (it.skins.length) h += `<h2>スキン(${it.skins.length})</h2><p><a href="#/skins/${encodeURIComponent(it.id)}">スキン画像一覧を見る</a></p>`;
  return h;
};

P.materials = () => {
  const rows = Object.values(I).filter(it => it.cat === 'Resource' || it.cat === 'Component');
  const cols = [
    {h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'種類', v:r=>cat(r.cat)},
    {h:'スタック', v:r=>r.stack, num:1}, {h:'使用レシピ数', v:r=>r.used_in.length, num:1},
    {h:'入手(焼成)', v:r=>r.from_burn.length, r:r=>itemList(r.from_burn.map(([s,a])=>[s,null]))},
    {h:'入手(リサイクル元の数)', v:r=>r.from_recycle.length, num:1},
    {h:'自身のレシピ', v:r=>r.recipe?1:0, r:r=>r.recipe ? itemList(r.recipe.items) : '<span class="muted">採取・入手のみ</span>'},
    {h:'燃料時間(秒)', v:r=>r.cfg.fuelTimeSeconds||0, num:1}, {h:'焼成時間(秒)', v:r=>r.cfg.burnTimeSeconds||0, num:1},
  ];
  return `<h1>素材・資源</h1><p class="sub">資源と部品の一覧。使用レシピ数が多いほど重要な素材です。</p>` + table(cols, rows.sort((a,b)=>b.used_in.length-a.used_in.length));
};

P.craft = () => {
  let rows = Object.values(I).filter(it => it.recipe);
  const cols = [
    {h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'カテゴリ', v:r=>cat(r.cat)},
    {h:'素材', v:r=>r.recipe.items.length, r:r=>itemList(r.recipe.items)},
    {h:'時間(秒)', v:r=>r.recipe.time, num:1}, {h:'個数', v:r=>r.recipe.count, num:1},
    {h:'研究Lv', v:r=>r.tech?r.tech.lv:'', num:1}, {h:'研究コスト', v:r=>r.tech?r.tech.cost:'', num:1},
  ];
  let q='';
  const draw = () => { document.getElementById('ct').innerHTML = table(cols, rows.filter(r => match(r,q) || r.recipe.items.some(([m]) => match(I[m]||{id:m},q)))); };
  setTimeout(draw,0);
  return `<h1>クラフトレシピ</h1><p class="sub">全${rows.length}レシピ。素材名で絞り込むと「その素材を使うレシピ」も表示されます。</p>${filterBox('アイテム名・素材名で絞り込み', v=>{q=v;draw();})}<div id="ct"></div>`;
};

P.recycle = () => {
  const rows = Object.values(I).filter(it => it.recycle.length);
  const cols = [{h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'カテゴリ', v:r=>cat(r.cat)},
    {h:'リサイクル結果', v:r=>r.recycle.length, r:r=>r.recycle.map(([m,a,p]) => itemLink(m,a,p<100?` <span class="x">(${p}%)</span>`:'')).join('')},
    {h:'スクラップ', v:r=>(r.recycle.find(x=>x[0]==='scrap')||[0,0])[1], num:1},
    {h:'元レシピ', v:r=>r.recipe?r.recipe.items.length:0, r:r=>r.recipe?itemList(r.recipe.items):'-'}];
  return `<h1>リサイクル</h1><p class="sub">リサイクラーに入れた時の還元量。%は入手確率(100%未満のみ表示)。</p>` + table(cols, rows);
};

P.smelt = () => {
  const b = Object.values(I).filter(it => it.burn);
  const f = Object.values(I).filter(it => it.cfg.fuelTimeSeconds || it.cfg.burnTimeSeconds);
  let h = `<h1>焼成・燃料</h1><h2>焼成(かまど)</h2>` + table([
    {h:'投入', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'結果', r:r=>itemList(r.burn), v:r=>nm(r.burn[0][0])},
    {h:'焼成時間(秒)', v:r=>r.cfg.burnTimeSeconds||'', num:1}], b);
  h += `<h2>燃料・焼成時間</h2>` + table([
    {h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'燃料時間(秒)', v:r=>r.cfg.fuelTimeSeconds||'', num:1},
    {h:'焼成時間(秒)', v:r=>r.cfg.burnTimeSeconds||'', num:1}], f);
  h += `<h2>燃料フィルタ(設置物ごとに入れられるもの)</h2>`;
  for (const k in D.filters) h += `<h3>${esc(jaKey(k))} ${vn(k)}</h3>` + kvTable(D.filters[k]);
  return h;
};

P.food = () => {
  const rows = Object.values(I).filter(it => it.cfg.canConsume || it.cfg.healthChange || it.cfg.hungerChangeMax || it.cfg.thirstChangeMax);
  return `<h1>消耗品・回復</h1><p class="sub">食料・薬品などの回復量と効果。</p>` + table([
    {h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'HP', v:r=>r.cfg.healthChange||0, num:1},
    {h:'満腹度', v:r=>r.cfg.hungerChangeMax||0, r:r=>rng(r.cfg.hungerChangeMin,r.cfg.hungerChangeMax), num:1},
    {h:'水分', v:r=>r.cfg.thirstChangeMax||0, r:r=>rng(r.cfg.thirstChangeMin,r.cfg.thirstChangeMax), num:1},
    {h:'放射線', v:r=>r.cfg.radiationChangeMax||0, r:r=>rng(r.cfg.radiationChangeMin,r.cfg.radiationChangeMax), num:1},
    {h:'バフ', v:r=>r.cfg.buffName||'', r:r=>r.cfg.buffName?`${tv(r.cfg.buffName)} ×${fmt(r.cfg.buffForce||0)} / ${fmt(r.cfg.buffDurationSeconds||0)}秒`:''},
    {h:'CT(秒)', v:r=>r.cfg.consumeCooldownSeconds||0, num:1}, {h:'BP経験値', v:r=>(r.cfg.bpExpAmount||0)+(r.cfg.miniBpExpAmount||0), num:1},
    {h:'スタック', v:r=>r.stack, num:1}], rows);
};
const rng = (a,b) => (!a && !b) ? '<span class="muted">0</span>' : (a===b||!a ? fmt(b) : `${fmt(a)}〜${fmt(b)}`);

P.weapons = () => {
  const rows = D.weapons.filter(w => w.rpm && w.rpm !== 0 || w.bullet_speed);
  return `<h1>銃器</h1><p class="sub">理論DPS(毎秒ダメージ) = ダメージ×ペレット数×毎分連射数÷60(リロード除く)。見出しクリックで並べ替え。</p>` + table([
    {h:'武器', v:r=>r.ja, r:r=>itemLink(r.short_name)}, {h:'弾薬', v:r=>nm(r.ammo), r:r=>r.ammo?itemLink(r.ammo):'-'},
    {h:'ダメージ', v:r=>r.damage, num:1}, {h:'ペレット', v:r=>r.pellets, num:1}, {h:'連射速度(毎分)', v:r=>r.rpm, num:1},
    {h:'理論DPS', v:r=>r['dps(理論)'], num:1}, {h:'装弾数', v:r=>r.mag, num:1}, {h:'リロード', v:r=>r.reload_s, num:1},
    {h:'距離減衰', v:r=>r.falloff}, {h:'射程', v:r=>r.max_range, num:1}, {h:'弾速', v:r=>r.bullet_speed, num:1},
    {h:'拡散', v:r=>r.base_disp, num:1}, {h:'縦反動', v:r=>r.recoil_v}, {h:'横反動', v:r=>r.recoil_h},
    {h:'機動性', v:r=>r.mobility, num:1}, {h:'耐久', v:r=>r.durability, num:1}, {h:'研究Lv', v:r=>r.tech_lv, num:1},
    {h:'研究コスト', v:r=>r.tech_cost, num:1}, {h:'製作(秒)', v:r=>r.craft_s, num:1}], rows);
};

P.melee = () => {
  const ws = new Set(D.weapons.filter(w => w.rpm || w.bullet_speed).map(w => w.short_name));
  const rows = Object.values(I).filter(it => (it.cat === 'Weapon' && !ws.has(it.id)) || it.cat === 'Tool');
  return `<h1>近接・その他武器 / ツール</h1>` + table([
    {h:'アイテム', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'種類', v:r=>cat(r.cat)},
    {h:'耐久', v:r=>r.cfg.durabilityMax||'', num:1}, {h:'レシピ', v:r=>r.recipe?1:0, r:r=>r.recipe?itemList(r.recipe.items):'-'},
    {h:'製作(秒)', v:r=>r.recipe?r.recipe.time:'', num:1}, {h:'研究Lv', v:r=>r.tech?r.tech.lv:'', num:1},
    {h:'研究コスト', v:r=>r.tech?r.tech.cost:'', num:1}], rows);
};

P.mods = () => `<h1>武器MOD</h1>` + table([
  {h:'MOD', v:r=>nm(r.short_name), r:r=>itemLink(r.short_name)}, {h:'スロット', v:r=>r.slot}, {h:'効果', v:r=>r.effects},
  {h:'素材', v:r=>r.recipe, r:r=>I[r.short_name]&&I[r.short_name].recipe?itemList(I[r.short_name].recipe.items):esc(r.recipe)},
  {h:'製作(秒)', v:r=>r.craft_s, num:1}, {h:'研究Lv', v:r=>r.tech_lv, num:1}, {h:'研究コスト', v:r=>r.tech_cost, num:1},
  {h:'対応武器', v:r=>0, r:r=>D.weapons.filter(w=>w.mods.includes(r.short_name)).map(w=>itemLink(w.short_name)).join('')}], D.mods);

P.armor = () => {
  const rows = Object.values(I).filter(it => it.prot);
  let h = `<h1>防具・防護値</h1><p class="sub">各ダメージ種別の軽減率。種別名は内部の並び順からの推定です。全27種は個別ページに掲載。</p>`;
  h += table([{h:'装備', v:r=>r.ja, r:r=>itemLink(r.id)}, {h:'部位', v:r=>cat(r.cat)},
    ...DT_MAIN.map(i => ({h:D.dt[i], v:r=>r.prot.v[i], r:r=>pct(r.prot.v[i]), num:1})),
    {h:'合計', v:r=>r.prot.v.reduce((a,b)=>a+b,0), r:r=>fmt(r.prot.v.reduce((a,b)=>a+b,0)), num:1},
    {h:'耐久', v:r=>r.cfg.durabilityMax||'', num:1}], rows);
  return h;
};

P.tech = () => {
  const lv = {}; D.tech.forEach(t => (lv[t.lv] = lv[t.lv] || []).push(t));
  const total = D.tech.reduce((a,t)=>a+(t.cost||0),0);
  return `<h1>テックツリー</h1><p class="sub">研究に必要なコストと前提。全項目の合計コスト: <b>${total.toLocaleString()}</b></p>` +
    Object.keys(lv).sort((a,b)=>a-b).map(l => `<div class="techlv"><div class="lv">Lv${l}</div><div class="grid">${
      lv[l].map(t => { const it = I[t.id] || {id:t.id, ja:t.id};
        return `<a class="card" href="#/item/${encodeURIComponent(t.id)}">${it.icon?`<img src="${it.icon}" loading="lazy">`:'<div class="noimg">-</div>'}<div class="n">${esc(it.ja)}</div><div class="e">コスト ${fmt(t.cost)}${t.req.length?'<br>前提: '+t.req.map(nm).map(esc).join(', '):''}</div></a>`; }).join('')}</div></div>`).join('');
};

P.levels = () => {
  const max = Math.max(...D.levels.map(l => l.exp_to_next));
  return `<h1>プレイヤーレベル</h1><p class="sub">各レベルで次のレベルに必要な経験値(全${D.levels.length}レベル)。</p>` + table([
    {h:'レベル', v:r=>r.level, num:1}, {h:'次Lvまで', v:r=>r.exp_to_next, num:1}, {h:'累計経験値', v:r=>r.cumulative_exp, num:1},
    {h:'', v:r=>r.exp_to_next, r:r=>`<div class="bar"><i style="width:${r.exp_to_next/max*100}%"></i></div>`}], D.levels);
};

P.quests = () => {
  let h = `<h1>クエスト・ミッション</h1><h2>NPCミッション</h2>` + table([
    {h:'ミッション', v:r=>r.ja, r:r=>`${esc(r.ja)}${vn(r.mission)}`}, {h:'対象', v:r=>r.item, r:r=>r.item?itemLink(r.item, r.count):'-'}, {h:'内容', v:r=>r.task}], D.missions);
  const ids = a => a.length ? a.map(tv).join(' ') : '<span class="muted">-</span>';
  h += `<h2>チュートリアルクエスト</h2>` + table([{h:'グループ', v:r=>r.group}, {h:'手順', v:r=>r.step, num:1}, {h:'種類', v:r=>r.type},
    {h:'クエスト', v:r=>r.quest}, {h:'対象', v:r=>r.target.join(), r:r=>ids(r.target)}, {h:'必要数', v:r=>r.progress, num:1},
    {h:'解放されるもの', v:r=>r.unlocks.join(), r:r=>ids(r.unlocks)}], D.quests);
  return h;
};

P.mobs = () => {
  const lbl = {on_detect:'発見時の行動',walk_speed:'歩行速度',run_speed:'走行速度',accel:'加速度',exhausted_accel:'疲労時加速度',exhaustion_s:'疲労時間(秒)',
    turn_speed:'旋回速度',view_angle:'視野角(°)',view_radius:'視認距離',detect_min:'最小検知距離',detect_max:'最大検知距離',melee_damage:'近接ダメージ',
    attack_dist:'攻撃距離',attack_speed:'攻撃速度',calmdown_s:'落ち着くまで(秒)',flee_dist:'逃走距離'};
  const beh = D.val;
  let h = `<h1>モブ(動物・NPC)</h1><p class="sub">動物AIの行動パラメータ。画像はモデルのテクスチャで、未同梱の動物はゲーム内の動物アイコンで代替しています。</p>`;
  h += `<h2>比較表</h2>` + table([{h:'動物', v:r=>r.ja, r:r=>`<a href="#/mob/${r.id}">${esc(r.ja)}</a>`},
    {h:'行動', v:r=>beh[r.stats.on_detect]||r.stats.on_detect}, {h:'走行速度', v:r=>r.stats.run_speed, num:1},
    {h:'近接ダメージ', v:r=>r.stats.melee_damage, num:1}, {h:'攻撃速度', v:r=>r.stats.attack_speed, num:1},
    {h:'視認距離', v:r=>r.stats.view_radius, num:1}, {h:'最大検知距離', v:r=>r.stats.detect_max, num:1}, {h:'逃走距離', v:r=>r.stats.flee_dist}], D.mobs);
  h += `<div class="grid">${D.mobs.map(m => `<a class="card" href="#/mob/${m.id}">${m.alt?'<span class="badge">代替画像</span>':''}${m.img?`<img src="${m.img}" style="object-fit:${m.alt?'contain':'cover'}">`:'<div class="noimg">-</div>'}<div class="n">${esc(m.ja)}</div><div class="e">${esc(m.id)}</div></a>`).join('')}</div>`;
  const eq = s => s.split(', ').map(x => { const m = x.match(/^(.*)\(skin(\d+)\)$/); return m ? itemLink(m[1], null, ` <span class="x">スキン${m[2]}</span>`) : tv(x); }).join('');
  h += `<h2>人型NPCの装備</h2>` + table([{h:'NPC', v:r=>npcJa(r.npc), r:r=>`${esc(npcJa(r.npc))}${vn(r.npc)}`}, {h:'パターン', v:r=>r.variant, num:1},
    {h:'確率', v:r=>r.chance, r:r=>`${Math.round(r.chance*100)}%`, num:1}, {h:'装備', v:r=>r.items, r:r=>eq(r.items)}], D.npcEq);
  P._mobLbl = lbl; P._beh = beh;
  return h;
};
P.mob = (id) => {
  const m = D.mobs.find(x => x.id === id); if (!m) return '見つかりません';
  if (!P._mobLbl) P.mobs();
  const rows = Object.keys(m.stats).map(k => [P._mobLbl[k]||k, k, m.stats[k]]);
  let h = `<p><a href="#/mobs">← モブ一覧</a></p><div class="mob">${m.img?`<img src="${m.img}" class="${m.alt?'alt':''}">`:''}<div><h1>${esc(m.ja)}</h1><p class="sub"><code>${esc(m.id)}</code></p></div></div>`;
  h += `<h2>基本パラメータ</h2>` + kvRows(rows);
  const stJa = n => { let k = n.replace(new RegExp('^' + m.id + '_?'), ''), w = '';
    const mm = k.match(/^(.*)\(([\d.]+)\)$/); if (mm) { k = mm[1]; w = `(確率${Math.round(+mm[2]*100)}%)`; }
    return (D.stateJa[k] || k) + w; };
  const trs = t => t ? t.split('; ').map(x => { const [a,b] = x.split('→'); return `${esc(D.trigger[a]||a)}${vn(a)} → <b>${esc(stJa(b||''))}</b>${vn(b||'')}`; }).join('<br>') : '-';
  const prm = t => t ? t.split('; ').map(x => { const i = x.indexOf('='); const k = x.slice(0,i), v = x.slice(i+1);
    return `${esc(D.stateKey[k]||k)}${vn(k)}: <b>${tv(isNaN(+v)||v===''?v:+v)}</b>`; }).join('<br>') : '-';
  h += `<h2>AIステート(${m.states.length})</h2>` + table([{h:'ステート', v:r=>r.ja, r:r=>`${esc(r.ja)}${vn(r.state)}`},
    {h:'遷移', v:r=>r.tr, r:r=>trs(r.tr)}, {h:'パラメータ', v:r=>r.params, r:r=>prm(r.params)}], m.states);
  return h;
};

P.loot = (sel) => {
  sel = sel ? decodeURIComponent(sel) : '';
  const names = Object.keys(D.loot).sort();
  const tree = (n, depth, seen) => {
    const t = D.loot[n]; if (!t || depth > 6 || seen.has(n)) return '';
    seen = new Set(seen).add(n);
    let s = `<ul class="tree">`;
    t.items.forEach(([id,a]) => s += `<li>${itemLink(id,a)}</li>`);
    t.sub.forEach(([c,p,m]) => s += `<li>${lootLink(c)} <span class="tag a">${fmt(p)}%</span>${m?'<span class="tag">抽選</span>':'<span class="tag">確定枠</span>'}${tree(c, depth+1, seen)}</li>`);
    return s + '</ul>';
  };
  if (sel && D.loot[sel]) {
    const t = D.loot[sel];
    return `<p><a href="#/loot">← ルート一覧</a></p><h1>${esc(lootJa(sel)||sel)}</h1><p class="sub"><code>${esc(sel)}</code></p><dl class="kv"><dt>出現数</dt><dd>${fmt(t.min)}〜${fmt(t.max)}</dd><dt>ランダム</dt><dd>${t.random?'はい':'いいえ'}</dd><dt>1種のみ抽選</dt><dd>${t.oneRandom?'はい':'いいえ'}</dd><dt>重複スキップ</dt><dd>${t.skipSame?'はい':'いいえ'}</dd><dt>確率倍率</dt><dd>${fmt(t.scale)}</dd></dl><h2>中身</h2>${tree(sel,0,new Set())}`;
  }
  const roots = names.filter(n => D.loot[n].sub.length);
  return `<h1>ルートテーブル</h1><p class="sub">箱や報酬の抽選テーブル(${names.length}件)。サブテーブルを持つもの(親テーブル)を先に表示します。</p>
  <h2>親テーブル</h2>${roots.map(n => `<div class="box" style="margin-bottom:10px"><h3>${lootLink(n)}</h3>${tree(n,0,new Set())}</div>`).join('')}
  <h2>全テーブル</h2>` + table([{h:'テーブル', v:r=>lootJa(r)||r, r:r=>lootLink(r)},
    {h:'アイテム', v:r=>D.loot[r].items.length, r:r=>itemList(D.loot[r].items)}, {h:'サブ数', v:r=>D.loot[r].sub.length, num:1},
    {h:'出現数', v:r=>D.loot[r].max, r:r=>`${fmt(D.loot[r].min)}〜${fmt(D.loot[r].max)}`}], names);
};

P.spawns = () => `<h1>資源スポーン</h1><p class="sub">ワールド上の資源・動物などの出現設定。名前は内部IDから自動で日本語化しています。</p>` + table([
  {h:'スポーン名', v:r=>spawnJa(r.population)||r.population, r:r=>{const j=spawnJa(r.population);return j?`${esc(j)}${vn(r.population)}`:`<code>${esc(r.population)}</code>`;}}, {h:'目標密度', v:r=>r.target_density, num:1}, {h:'出現率', v:r=>r.spawn_rate, num:1},
  {h:'群れ最小', v:r=>r.cluster_min, num:1}, {h:'群れ最大', v:r=>r.cluster_max, num:1}, {h:'バリエーション数', v:r=>r.variants, num:1},
  {h:'詳細パラメータ', v:r=>'', r:r=>`<details><summary class="muted">表示</summary>${kvTable(r.other)}</details>`}], D.spawns);

P.world = () => {
  const ja = {AirdropConfig:'エアドロップ',AirdropFleetEventConfig:'エアドロップ編隊イベント',PatrolHeliConfig:'パトロールヘリ',ParachuteConfig:'パラシュート',
    AimAssistConfig:'エイムアシスト',CandyEffectsConfig:'キャンディ効果',ValentineEventShopConfig:'バレンタインショップ',ResourcesVaultNetworkObjectConfig:'資源保管庫',
    WorldStreamingConfig:'ワールド読み込み',MapNamesInfo:'マップ名',TeammateColorsConfig:'チームメイト色',ClanmateColorsConfig:'クランメイト色',
    PickupZoneCategoryOrder:'ピックアップ順',BuildingCategoriesConfig:'建築カテゴリ',RedMoonConfigSO:'レッドムーン(赤い月の夜)',FoggyNightConfigSO:'霧の夜'};
  const keys = Object.keys(D.world);
  return `<h1>ワールド・イベント設定</h1><p class="sub">${keys.map(k=>`<a href="#/world" onclick="document.getElementById('w_${k}').scrollIntoView();return false">${ja[k]||k}</a>`).join(' / ')}</p>` +
    keys.map(k => `<h2 id="w_${k}">${ja[k]||k} ${vn(k)}</h2>` + kvTable(D.world[k])).join('');
};

P.biome = () => `<h1>バイオーム照明</h1><p class="sub">バイオームごとの時間帯別ライティング設定(色@時刻)。</p>` +
  table(Object.keys(D.biome[0]||{}).map(k => ({h:`${esc(jaKey(k))}${vn(k)}`, v:r=>r[k], r:r=>D.val[r[k]] ? esc(D.val[r[k]]) : esc(r[k]).replace(/#([0-9A-F]{6})/g,'<span class="swatch" style="background:#$1"></span>#$1')})), D.biome);

P.skins = (base) => {
  base = base ? decodeURIComponent(base) : '';
  const bases = [...new Set(D.skins.map(s=>s.base).filter(Boolean))].sort((a,b)=>nm(a).localeCompare(nm(b),'ja'));
  let q = '';
  const draw = () => {
    const list = D.skins.filter(s => (!base || s.base === base) && (!q || s.id.toLowerCase().includes(q) || nm(s.base).includes(q)));
    const sb = s => s.src === 'alt' ? '<span class="badge" title="スキン画像が未同梱のためベースアイテムの画像を表示">代替画像</span>' : s.src === 'color' ? '<span class="badge c" title="マテリアルの色から作成">色見本</span>' : s.src === 'texture' ? '<span class="badge c" title="マテリアルのテクスチャ">テクスチャ</span>' : '';
    document.getElementById('sg').innerHTML = list.map(s => `<div class="card">${sb(s)}${s.img?`<img src="${s.img}" loading="lazy">`:'<div class="noimg">画像は<br>未同梱</div>'}<div class="n">${esc(nm(s.base)||'-')}</div><div class="e">${esc(s.id)}</div><div class="e">${esc(D.val[s.kind]||s.kind)}</div></div>`).join('');
    document.getElementById('cnt').textContent = list.length + '件';
  };
  setTimeout(draw, 0);
  return `<h1>スキン</h1><p class="sub">全${D.skins.length}種。スキン画像 ${D.skins.filter(s=>s.src&&s.src!=='alt').length}種 / 代替画像 ${D.skins.filter(s=>s.src==='alt').length}種(元画像が未同梱のためベースアイテムの画像)。</p>
  <select class="filter" onchange="location.hash='#/skins/'+encodeURIComponent(this.value)"><option value="">すべてのベースアイテム</option>${
    bases.map(b=>`<option value="${esc(b)}"${b===base?' selected':''}>${esc(nm(b))} (${D.skins.filter(s=>s.base===b).length})</option>`).join('')}</select>
  ${filterBox('スキン名で絞り込み', v=>{q=v;draw();})} <span id="cnt" class="muted"></span><div id="sg" class="grid"></div>`;
};

// ---------- ルーター ----------
function route(){
  const h = location.hash.replace(/^#\/?/, '');
  const [page, ...args] = h.split('/');
  const fn = P[page] || P[''];
  M.innerHTML = fn(...args);
  window.scrollTo(0,0);
  document.querySelectorAll('.nav a').forEach(a => {
    const t = a.getAttribute('href').replace(/^#\/?/, '');
    a.classList.toggle('on', t === page || (page==='item'&&t==='items') || (page==='mob'&&t==='mobs'));
  });
  navEl.classList.remove('open'); mask.classList.remove('open');
  const titles = {items:'アイテム一覧',item:(I[decodeURIComponent(args[0]||'')]||{}).ja,weapons:'銃器',mobs:'モブ',tech:'テックツリー',craft:'クラフトレシピ'};
  document.title = (titles[page] ? titles[page] + ' - ' : '') + 'OXIDE 攻略データベース';
}
window.addEventListener('hashchange', route);
document.getElementById('ver').textContent = 'v' + D.meta.version;
const navEl = document.getElementById('nav'), mask = document.createElement('div');
mask.className = 'nav-mask'; document.body.appendChild(mask);
const setNav = o => { navEl.classList.toggle('open', o); mask.classList.toggle('open', o); };
document.getElementById('menuBtn').onclick = () => setNav(!navEl.classList.contains('open'));
mask.onclick = () => setNav(false);
// 読み込めない画像はプレースホルダーに置き換え
document.addEventListener('error', e => {
  const t = e.target; if (t.tagName !== 'IMG' || t.dataset.err) return; t.dataset.err = 1;
  const d = document.createElement('div'); d.className = 'noimg' + (t.classList.contains('big') ? ' big' : ''); d.textContent = '画像なし';
  if (t.closest('.it') || t.closest('.suggest')) t.style.visibility = 'hidden'; else t.replaceWith(d);
}, true);

// ---------- 検索 ----------
const q = document.getElementById('q'), sg = document.getElementById('suggest');
const pool = Object.values(I).map(it => ({type:'item', id:it.id, label:it.ja, sub:it.id + ' / ' + cat(it.cat), icon:it.icon, key:(it.ja+' '+it.en+' '+it.id).toLowerCase()}))
  .concat(D.mobs.map(m => ({type:'mob', id:m.id, label:m.ja, sub:'モブ', icon:m.img, key:(m.ja+' '+m.id).toLowerCase()})));
let sel = -1, hits = [];
q.oninput = () => {
  const v = q.value.trim().toLowerCase(); sel = -1;
  if (!v) { sg.style.display = 'none'; return; }
  hits = pool.filter(p => p.key.includes(v)).slice(0, 30);
  sg.innerHTML = hits.map((p,i) => `<a href="#/${p.type}/${encodeURIComponent(p.id)}" data-i="${i}">${p.icon?`<img src="${p.icon}">`:'<span style="width:28px"></span>'}<span>${esc(p.label)}<br><small class="muted">${esc(p.sub)}</small></span></a>`).join('') || '<a>該当なし</a>';
  sg.style.display = 'block';
};
q.onkeydown = e => {
  const as = sg.querySelectorAll('a[data-i]');
  if (e.key === 'ArrowDown') { sel = Math.min(sel+1, as.length-1); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = Math.max(sel-1, 0); e.preventDefault(); }
  else if (e.key === 'Enter') { const a = as[sel < 0 ? 0 : sel]; if (a) { location.hash = a.getAttribute('href'); q.value=''; sg.style.display='none'; } return; }
  else if (e.key === 'Escape') { sg.style.display = 'none'; return; } else return;
  as.forEach((a,i) => a.classList.toggle('sel', i === sel));
};
sg.onclick = () => { q.value = ''; sg.style.display = 'none'; };
document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) sg.style.display = 'none'; });
route();
})();
