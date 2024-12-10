const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
	app.use(
		"/api",
		createProxyMiddleware({
			target: "https://attendance-capturer-backend.onrender.com",
			changeOrigin: true,
		})
	);
};
