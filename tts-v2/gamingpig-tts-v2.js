//#region src/main.js
var e = null, t = 0, n = /* @__PURE__ */ new Map();
function r() {
	return e || (e = new Worker(new URL(
		/* @vite-ignore */
		"" + new URL("assets/worker-DwCdubaz.js", import.meta.url).href,
		"" + import.meta.url
	), { type: "module" }), e.onmessage = (e) => {
		let { id: t, type: r } = e.data, i = n.get(t);
		i && (r === "progress" ? i.onProgress && i.onProgress({
			loaded: e.data.loaded,
			total: e.data.total
		}) : r === "computing" ? i.onComputing && i.onComputing() : r === "done" ? (n.delete(t), i.resolve(new Blob([e.data.buffer], { type: "audio/wav" }))) : r === "error" && (n.delete(t), i.reject(Error(e.data.message))));
	}, e.onerror = (e) => {
		for (let [, t] of n) t.reject(e);
		n.clear();
	}), e;
}
async function i(e, i, a) {
	let o = r(), s = ++t;
	return new Promise((t, r) => {
		n.set(s, {
			resolve: t,
			reject: r,
			onProgress: i,
			onComputing: a
		}), o.postMessage({
			id: s,
			type: "speak",
			text: e
		});
	});
}
window.GamingpigTTS = { speak: i };
//#endregion
