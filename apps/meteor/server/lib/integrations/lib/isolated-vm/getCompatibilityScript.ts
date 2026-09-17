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

	const reproxy = (reference) => {
		return new Proxy(reference, {
			get(target, p, receiver) {
				if (target !== reference || p === 'then') {
					return Reflect.get(target, p, receiver);
				}

				const data = reference.get(p);

				if (typeof data === 'object' && data instanceof ivm.Reference && data.typeof === 'function') {
					return (...args) => data.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });
				}

				return data;
			}
		});
	};

	//url, options, allowSelfSignedCertificate
	const fetch = async (...args) => {
		const result = await serverFetch.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });

		if (result && typeof result === 'object' && result.isProxy) {
			return reproxy(result);
		}

		return result;
	};

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
