import proxyquire from 'proxyquire';

proxyquire.noCallThru().load('mongodb', {
	ObjectId: class ObjectId {
		toHexString(): string {
			return 'hexString';
		}
	},
	global: true,
});
