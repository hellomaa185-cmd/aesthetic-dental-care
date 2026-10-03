// api/health.ts
function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res.status(200).json({
    ok: true,
    status: "ok",
    environment: process.env.VERCEL ? "vercel" : process.env.NODE_ENV || "development",
    service: "aesthetic-dental-api",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
export {
  handler as default
};
