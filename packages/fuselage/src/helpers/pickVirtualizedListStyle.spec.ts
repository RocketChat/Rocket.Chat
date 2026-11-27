import { pickVirtualizedListStyle } from './pickVirtualizedListStyle';

it('keeps the offsets a virtualizer computes and drops every other key', () => {
	expect(pickVirtualizedListStyle({ style: { paddingTop: 120, paddingBottom: 40, marginTop: 0, color: 'red', width: 10 } })).toEqual({
		style: { paddingTop: 120, paddingBottom: 40, marginTop: 0 },
	});
});

it('hands the element no style when there is nothing to keep', () => {
	expect(pickVirtualizedListStyle({})).toEqual({});
	expect(pickVirtualizedListStyle({ style: { color: 'red' } })).toEqual({});
});
