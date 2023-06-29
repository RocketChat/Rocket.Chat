export const isValidReference = (reference, e) => {
	let _a;
	const isValidTarget = Boolean(e.target);
	const isValidReference =
		e.target !== reference.current && !((_a = reference.current) === null || _a === void 0 ? void 0 : _a.contains(e.target));
	return isValidTarget && isValidReference;
};
// # sourceMappingURL=isValidReference.js.map
