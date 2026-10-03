import { shouldScrollToBottom } from './useAutoGrow';

const mockTextarea = ({
	selectionEnd,
	valueLength,
	scrollTop,
	clientHeight,
	scrollHeight,
}: {
	selectionEnd: number;
	valueLength: number;
	scrollTop: number;
	clientHeight: number;
	scrollHeight: number;
}): HTMLTextAreaElement =>
	({
		selectionEnd,
		value: { length: valueLength },
		scrollTop,
		clientHeight,
		scrollHeight,
	}) as unknown as HTMLTextAreaElement;

describe('shouldScrollToBottom', () => {
	it('returns true when the caret is at the end of the text', () => {
		const textarea = mockTextarea({ selectionEnd: 10, valueLength: 10, scrollTop: 0, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(true);
	});

	it('returns true when scrolled exactly to the bottom (integer metrics)', () => {
		const textarea = mockTextarea({ selectionEnd: 0, valueLength: 100, scrollTop: 160, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(true);
	});

	it('returns true when scrolled to the bottom with a fractional scrollTop (high-DPI / zoom)', () => {
		// On high-DPI displays or browser zoom, scrollTop is fractional, so
		// scrollTop + clientHeight rarely equals scrollHeight exactly.
		const textarea = mockTextarea({ selectionEnd: 0, valueLength: 100, scrollTop: 159.5, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(true);
	});

	it('returns false when not scrolled to the bottom and caret is not at the end', () => {
		const textarea = mockTextarea({ selectionEnd: 0, valueLength: 100, scrollTop: 0, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(false);
	});

	// Pin the intended 1px tolerance so a regression that loosens it fails these tests.
	it('returns true at the 1px tolerance boundary (1px above the bottom)', () => {
		const textarea = mockTextarea({ selectionEnd: 0, valueLength: 100, scrollTop: 159, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(true);
	});

	it('returns false just beyond the 1px tolerance (2px above the bottom)', () => {
		const textarea = mockTextarea({ selectionEnd: 0, valueLength: 100, scrollTop: 158, clientHeight: 40, scrollHeight: 200 });
		expect(shouldScrollToBottom(textarea)).toBe(false);
	});
});
