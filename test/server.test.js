"use strict";
const test = require("node:test");
const assert = require("node:assert");
const app = require("../server");

let base, server;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const get = (p) => fetch(base + p);

test("trang chủ nhúng đủ dữ liệu và cấu hình", async () => {
  const res = await get("/");
  assert.strictEqual(res.status, 200);
  const h = await res.text();
  assert.ok(!/\{\{[A-Z]+\}\}/.test(h), "còn sót ký hiệu {{...}} chưa thay");
  const kb = JSON.parse(/<script id="kb" type="application\/json">([\s\S]*?)<\/script>/.exec(h)[1]);
  assert.strictEqual(kb.procs.length, 46);
  const cfg = JSON.parse(/<script id="cfg" type="application\/json">([\s\S]*?)<\/script>/.exec(h)[1]);
  assert.match(cfg.diaChi, /Tân An Hội/);
  assert.match(res.headers.get("content-security-policy"), /script-src 'self'/);
});

test("tệp tĩnh và ảnh cũ được phục vụ", async () => {
  const h = await (await get("/")).text();
  const imgs = [...new Set([...h.matchAll(/src="(\/assets\/img\/[^"]+)"/g)].map((m) => m[1]))];
  assert.ok(imgs.length >= 15);
  for (const src of [...imgs, "/assets/css/site.css", "/assets/js/app.js", "/assets/js/engine.js", "/favicon.svg"]) {
    assert.strictEqual((await get(src)).status, 200, src);
  }
});

test("trang riêng của từng thủ tục và biểu mẫu", async () => {
  const list = await (await get("/api/thu-tuc")).json();
  assert.strictEqual(list.length, 46);
  for (const p of list) assert.strictEqual((await get(`/thu-tuc/${p.id}`)).status, 200, p.id);
  const forms = await (await get("/api/bieu-mau")).json();
  assert.strictEqual(forms.length, 34);
  for (const f of forms) assert.strictEqual((await get(`/bieu-mau/${encodeURIComponent(f.so)}`)).status, 200, f.so);
  assert.strictEqual((await get("/thu-tuc/khong-co")).status, 404);
  const sm = await (await get("/sitemap.xml")).text();
  assert.strictEqual((sm.match(/<loc>/g) || []).length, 3 + 46 + 34);
});

test("API hỏi đáp giữ phiên để trả lời theo số thứ tự", async () => {
  const ask = (body) => fetch(base + "/api/hoi-dap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  const a = await ask({ q: "hồ sơ tách thửa gồm những gì" });
  assert.strictEqual(a.ketQua.t, "answer");
  assert.match(a.traLoi.join("\n"), /Mẫu số 21/);
  const b = await ask({ q: "đính chính sổ", phien: a.phien });
  assert.strictEqual(b.phien, a.phien);
  if (b.ketQua.t === "pick" || b.ketQua.t === "subject") {
    const c = await ask({ q: "1", phien: a.phien });
    assert.ok(["answer", "overview", "pick"].includes(c.ketQua.t));
  }
  const bad = await fetch(base + "/api/hoi-dap", { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
  assert.strictEqual(bad.status, 400);
});
