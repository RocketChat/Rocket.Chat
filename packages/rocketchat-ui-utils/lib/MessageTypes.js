export const MessageTypes = new class {
	constructor() {
		this.types = {};
	}

	registerType(options) {
		return this.types[options.id] = options;
	}

	getType(message) {
		return this.types[message && message.t];
	}

	isSystemMessage(message) {
		const type = this.types[message && message.t];
		return type && type.system;
	}

};
