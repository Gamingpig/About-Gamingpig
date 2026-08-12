//#region src/main.js
var e = null, t = 0, n = /* @__PURE__ */ new Map();
function r() {
	return e || (e = new Worker(new URL(
		/* @vite-ignore */
		"" + new URL("assets/worker-D8XGySxF.js", import.meta.url).href,
		"" + import.meta.url
	), { type: "module" }), e.onmessage = (e) => {
		let { id: t, type: r } = e.data, i = n.get(t);
		i && (r === "progress" ? i.onProgress && i.onProgress({
			loaded: e.data.loaded,
			total: e.data.total
		}) : r === "done" ? (n.delete(t), i.resolve(new Blob([e.data.buffer], { type: "audio/wav" }))) : r === "error" && (n.delete(t), i.reject(Error(e.data.message))));
	}, e.onerror = (e) => {
		for (let [, t] of n) t.reject(e);
		n.clear();
	}), e;
}
async function i(e, i) {
	let a = r(), o = ++t;
	return new Promise((t, r) => {
		n.set(o, {
			resolve: t,
			reject: r,
			onProgress: i
		}), a.postMessage({
			id: o,
			type: "speak",
			text: e
		});
	});
}
window.GamingpigTTS = { speak: i };
//#endregion
