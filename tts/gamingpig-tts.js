//#region src/main.js
var e = null, t = 0, n = /* @__PURE__ */ new Map();
function r() {
	return e || (e = new Worker(new URL(
		/* @vite-ignore */
		"" + new URL("assets/worker-CaffoQN4.js", import.meta.url).href,
		"" + import.meta.url
	), { type: "module" }), e.onmessage = (e) => {
		let { id: t, type: r } = e.data, i = n.get(t);
		i && (r === "progress" ? i.onProgress && i.onProgress({
			loaded: e.data.loaded,
			total: e.data.total
		}) : r === "done" ? (n.delete(t), i.resolve(new Blob([e.data.buffer], { type: "audio/wav" }))) : r === "stored-result" ? (n.delete(t), i.resolve(e.data.stored)) : r === "error" && (n.delete(t), i.reject(Error(e.data.message))));
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
			onProgress: a
		}), o.postMessage({
			id: s,
			type: "speak",
			text: e,
			voiceId: i
		});
	});
}
async function a() {
	let e = r(), i = ++t;
	return new Promise((t, r) => {
		n.set(i, {
			resolve: t,
			reject: r
		}), e.postMessage({
			id: i,
			type: "stored"
		});
	});
}
window.GamingpigTTS = {
	speak: i,
	storedVoices: a
};
//#endregion
