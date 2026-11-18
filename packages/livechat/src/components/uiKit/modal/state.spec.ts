import { createModalState, isInputElementBlock, recordInput } from './state';

const blocks = [
	{ type: 'input', blockId: 'name', element: { type: 'plain_text_input', actionId: 'name-input', initialValue: 'Ada' } },
	{ type: 'input', blockId: 'plan', element: { type: 'static_select', actionId: 'plan-select', initialOption: { value: 'pro' } } },
	{ type: 'input', blockId: 'day', element: { type: 'datepicker', actionId: 'day-picker' } },
	{ type: 'input', element: { type: 'plain_text_input', actionId: 'no-block-id', initialValue: 'x' } },
	{ type: 'actions', blockId: 'buttons', elements: [] },
];

describe('modal view state', () => {
	it('starts from the initial values of input blocks that have a blockId', () => {
		expect(createModalState(blocks, {})).toEqual({
			name: { 'name-input': 'Ada' },
			plan: { 'plan-select': 'pro' },
		});
	});

	it('prefers what the visitor changed', () => {
		const changes = recordInput({}, 'day', 'day-picker', { selectedDate: '2026-11-03' });

		expect(createModalState(blocks, changes)).toMatchObject({ day: { 'day-picker': '2026-11-03' } });
	});

	it('records a value from an element payload', () => {
		expect(recordInput({}, 'name', 'name-input', { value: 'Bo' })).toEqual({ name: { 'name-input': 'Bo' } });
	});

	it('tells input elements apart from other elements', () => {
		expect(isInputElementBlock(blocks, 'name', 'name-input')).toBe(true);
		expect(isInputElementBlock(blocks, 'buttons', 'name-input')).toBe(false);
	});
});
