export const getCompatibilityScript = (customScript?: string) => `
	const Store = (function() {
		const store = {};
		return {
			set(key, val) {
				store[key] = val;
				return val;
			},
			get(key) {
				return store[key];
			},
		};
	})();

	${customScript}

	(function() {
		const instance = new Script();

		const functions = {
			...(typeof instance['prepare_outgoing_request'] === 'function' ? { prepare_outgoing_request : (...args) => instance.prepare_outgoing_request(...args) } : {}),
			...(typeof instance['process_outgoing_response'] === 'function' ? { process_outgoing_response : (...args) => instance.process_outgoing_response(...args) } : {}),
			...(typeof instance['process_incoming_request'] === 'function' ? { process_incoming_request : (...args) => instance.process_incoming_request(...args) } : {}),
		};

		return {
			...functions,
			availableFunctions: Object.keys(functions),
		}
	})();
`;
