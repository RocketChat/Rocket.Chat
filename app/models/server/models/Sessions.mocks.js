import mock from 'mock-require';

mock('./_Base', {
	Base: class Base {
		model = {
			rawDatabase() {
				return {
					collection() {},
					options: {},
				};
			},
		}

		tryEnsureIndex() {}
	},
});
