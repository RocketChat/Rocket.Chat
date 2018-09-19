class SignalProtocolStore {
	constructor() {
		this.store = {};
	}
	put(key, value) {
		if (key === undefined || value === undefined || key === null || value === null) {
			throw new Error('Tried to store undefined/null');
		}
		this.store[key] = value;
	}
	get(key, defaultValue) {
		if (key === null || key === undefined) {
			throw new Error('Tried to get value for undefined/null key');
		}
		if (key in this.store) {
			return this.store[key];
		} else {
			return defaultValue;
		}
	}
}

export const E2EStorage = new SignalProtocolStore();
