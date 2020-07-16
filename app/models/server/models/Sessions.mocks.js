import mock from 'mock-require';

mock('./_Base', {
	Base: class Base {
		tryEnsureIndex() {}
	},
});
