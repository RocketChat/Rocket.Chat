import mock from 'mock-require';

mock('mongodb', {
	ObjectId: class ObjectId {
		toHexString(): string {
			return 'hexString';
		}
	},
});
