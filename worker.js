// 成绩查询 Worker
// 绑定 D1 数据库: DB (points)

const SUBJECTS = [{"key": "yw", "label": "语文"}, {"key": "sx", "label": "数学"}, {"key": "yy", "label": "英语"}, {"key": "wl", "label": "物理"}, {"key": "wy", "label": "小语种"}, {"key": "hx", "label": "化学"}, {"key": "sw", "label": "生物"}, {"key": "zz", "label": "政治"}, {"key": "dl", "label": "地理"}];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>成绩查询</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:0 auto;padding:24px 16px;color:#222;background:#fafafa}
  h1{text-align:center;font-size:24px;margin:8px 0 4px}
  .sub{text-align:center;color:#888;font-size:13px;margin-bottom:16px}
  .box{display:flex;gap:8px;margin:16px 0}
  input{flex:1;padding:12px;font-size:16px;border:1px solid #ccc;border-radius:8px;outline:none}
  input:focus{border-color:#1a73e8}
  button{padding:12px 24px;font-size:16px;border:0;border-radius:8px;background:#1a73e8;color:#fff;cursor:pointer;white-space:nowrap}
  button:active{background:#1558b0}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;background:#fff}
  th,td{border:1px solid #ddd;padding:8px 6px;text-align:center}
  th{background:#f0f4f9}
  .err{color:#c00;margin-top:12px;text-align:center}
  .meta{margin-top:16px;font-size:15px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px 16px}
  .meta b{margin-right:18px}
</style>
</head>
<body>
<h1>成绩查询</h1>
<div class="sub">请输入 11 位学号进行查询</div>
<div class="box">
  <input id="xh" inputmode="numeric" maxlength="11" placeholder="例如：30129200109" autocomplete="off">
  <button id="btn">查询</button>
</div>
<div id="out"></div>
<script>
const $ = id => document.getElementById(id);
const cell = v => (v === null || v === undefined || v === '') ? '-' : v;
async function query() {
  const xh = $('xh').value.trim();
  const out = $('out');
  if (!/^\\d{11}$/.test(xh)) { out.innerHTML = '<div class="err">请输入 11 位数字学号</div>'; return; }
  out.innerHTML = '<div class="sub">查询中…</div>';
  try {
    const r = await fetch('/api/query?xh=' + encodeURIComponent(xh));
    const d = await r.json();
    if (!d.ok) { out.innerHTML = '<div class="err">' + d.error + '</div>'; return; }
    let h = '<div class="meta"><b>学号：' + d.xh + '</b><b>选科：' + (d.xuanke || '-') + '</b></div>';
    h += '<table><tr><th>科目</th><th>原始分</th><th>赋分</th><th>班排名</th><th>校排名</th><th>市排名</th><th>联排名</th></tr>';
    const t = d.total;
    h += '<tr><td><b>总分</b></td><td>' + cell(t.ys) + '</td><td>' + cell(t.ff) + '</td><td>' + cell(t.ban) + '</td><td>' + cell(t.xiao) + '</td><td>' + cell(t.shi) + '</td><td>' + cell(t.lian) + '</td></tr>';
    for (const s of d.subjects) {
      h += '<tr><td><b>' + s.subject + '</b></td><td>' + cell(s.ys) + '</td><td>' + cell(s.ff) + '</td><td>' + cell(s.ban) + '</td><td>' + cell(s.xiao) + '</td><td>' + cell(s.shi) + '</td><td>' + cell(s.lian) + '</td></tr>';
    }
    h += '</table>';
    out.innerHTML = h;
  } catch (e) {
    out.innerHTML = '<div class="err">查询失败，请稍后重试</div>';
  }
}
$('btn').addEventListener('click', query);
$('xh').addEventListener('keydown', e => { if (e.key === 'Enter') query(); });
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/query') {
      const xh = (url.searchParams.get('xh') || '').trim();
      if (!/^\d{11}$/.test(xh)) {
        return json({ ok: false, error: '请输入11位学号' }, 400);
      }
      let row = null;
      try {
        row = await env.DB.prepare('SELECT * FROM scores WHERE xh = ?1').bind(xh).first();
      } catch (e) {
        return json({ ok: false, error: '数据库查询失败' }, 500);
      }
      if (!row) {
        return json({ ok: false, error: '未找到该学号的成绩信息' });
      }
      const total = {
        ys: row.zf_ys ?? null, ff: row.zf_ff ?? null,
        ban: row.zf_ban ?? null, xiao: row.zf_xiao ?? null,
        shi: row.zf_shi ?? null, lian: row.zf_lian ?? null,
      };
      const subjects = [];
      for (const s of SUBJECTS) {
        const ys = row[s.key + '_ys'];
        if (ys === null || ys === undefined || ys === '') continue;
        subjects.push({
          subject: s.label,
          ys,
          ff: row[s.key + '_ff'] ?? null,
          ban: row[s.key + '_ban'] ?? null,
          xiao: row[s.key + '_xiao'] ?? null,
          shi: row[s.key + '_shi'] ?? null,
          lian: row[s.key + '_lian'] ?? null,
        });
      }
      return json({ ok: true, xh: row.xh, xuanke: row.xuanke || '', total, subjects });
    }
    return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  },
};
