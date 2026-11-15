function managerEntries(entry = []) {
	return [...entry, require.resolve('./dist/esm/preset/manager')];
}

module.exports = {
	managerEntries,
};
