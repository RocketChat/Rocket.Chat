import { getMomentCurrentLabel } from './getMomentCurrentLabel';

describe('getMomentCurrentLabel', () => {
	it('should create timing labels from midnight to noon', () => {
		const label = getMomentCurrentLabel(12 * 60 * 60 * 1000);
		expect(label).toStrictEqual('12PM-1PM');
	});
});
