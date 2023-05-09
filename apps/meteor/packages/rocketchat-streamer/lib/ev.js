/* globals EV:true */
/* exported EV */

EV = class EV {
	constructor() {
		this.handlers = {};
	}

	emit(event, ...args) {
		return this.handlers[event] && this.handlers[event].forEach(handler => handler.apply(this, args));
	}

	emitWithScope(event, scope, ...args) {
		return this.handlers[event] && this.handlers[event].forEach(handler => handler.apply(scope, args));
	}

	listenerCount(event) {
		return (this.handlers[event] && this.handlers[event].length) || 0;
	}

	on(event, callback) {
		if (!this.handlers[event]) {
			this.handlers[event] = [];
		}
		this.handlers[event].push(callback);
	}

	once(event, callback) {
		const self = this;
		this.on(event, function onetimeCallback() {
			self.removeListener(event, onetimeCallback);
			callback.apply(this, arguments);
		});
	}

	removeListener(event, callback) {
		if (!this.handlers[event]) {
			return;
		}
		const index = this.handlers[event].indexOf(callback);
		if (index > -1) {
			this.handlers[event].splice(index, 1);
		}
	}

	removeAllListeners(event) {
		this.handlers[event] = undefined;
	}
};
