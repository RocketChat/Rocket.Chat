function database() {
	const adapter = new Symbol('adapter');
	return {
		actions: {
			find: {
				cache: {
					keys: ['fields', 'limit', 'offset', 'sort'],
				},
				params: {
					fields: [
						{ type: 'string', optional: true },
						{ type: 'array', optional: true, items: 'string' },
					],
					limit: { type: 'number', integer: true, min: 0, optional: true, convert: true },
					offset: { type: 'number', integer: true, min: 0, optional: true, convert: true },
					sort: { type: 'string', optional: true },
				},
				handler(ctx) {
					const { params } = ctx;
					return this[adapter].find(params);
				},
			},
			get: {
				cache: {
					keys: ['_id'],
				},
				params: {
					fields: [
						{ type: 'string', optional: true },
						{ type: 'array', optional: true, items: 'string' },
					],
					sort: { type: 'string', optional: true },
					_id: 'string',
				},
				handler({ params }) {
					return this[adapter].findOne({ _id: params._id });
				},
			},
		},
		created() {
			this[adapter] = {
				find(...args) { return args ; },
				findOne(...args) { return args ; },
			};
		},
	};
}

export default {
	name: 'settings',
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	mixins: [database],
	events: {
		'setting'() {
			if (this.broker.cacher) {
				this.broker.cacher.clean('settings.**');
			}
		},
	},
};
