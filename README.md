# 成绩查询

输入 11 位学号，查询 D1 数据库中的成绩信息（总分、各科原始分/赋分与班/校/市/联排名），结果以表格呈现。

## 部署

```bash
npx wrangler deploy
```

需要先在 Cloudflare 创建名为 `points` 的 D1 数据库，并将 `database_id` 填入 `wrangler.toml`。
