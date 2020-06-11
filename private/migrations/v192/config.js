module.exports = {
	get(key) {
		return this[key];
	},
	set(key, value) {
		this[key] = value;
	},
};
