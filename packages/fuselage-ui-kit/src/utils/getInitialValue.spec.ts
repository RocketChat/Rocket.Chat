import { getInitialValue } from './getInitialValue';

it('keeps an initial_date_time of 0', () => {
	expect(getInitialValue({ type: 'datetimepicker', appId: 'app', blockId: 'block', actionId: 'when', initial_date_time: 0 })).toBe(0);
});
