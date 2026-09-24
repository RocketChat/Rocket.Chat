import { shouldApplySubscriptionChange } from './shouldApplySubscriptionChange';

describe('shouldApplySubscriptionChange', () => {
	it.each(['inserted', 'updated'])('applies a change %s for this room', (event) => {
		expect(shouldApplySubscriptionChange(event, 'rid', 'rid')).toBe(true);
	});

	it('ignores changes for other rooms', () => {
		expect(shouldApplySubscriptionChange('updated', 'other', 'rid')).toBe(false);
	});

	it('ignores changes without a room', () => {
		expect(shouldApplySubscriptionChange('updated', undefined, 'rid')).toBe(false);
	});

	it('ignores the removal of this room subscription', () => {
		expect(shouldApplySubscriptionChange('removed', 'rid', 'rid')).toBe(false);
	});
});
