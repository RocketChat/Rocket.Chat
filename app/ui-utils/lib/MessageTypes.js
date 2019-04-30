export const MessageTypes = new class {
	constructor() {
		this.types = {};
	}

	registerType(options) {
		this.types[options.id] = options;
		return options;
	}

	getType(message) {
		return this.types[message && message.t];
	}

	isSystemMessage(message) {
		const type = this.types[message && message.t];
		return type && type.system;
	}
};
