import { createComposerAPI } from './createComposerAPI';

jest.mock('../../../../client/lib/chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

const setupComposer = (initialValue: string, cursor: { start: number; end: number }) => {
	const input = document.createElement('textarea');
	document.body.appendChild(input);

	const composer = createComposerAPI(input, jest.fn(), '', Number.MAX_SAFE_INTEGER, { current: null }, { rid: 'GENERAL' });

	input.value = initialValue;
	input.setSelectionRange(cursor.start, cursor.end);

	return { composer, input };
};

afterEach(() => {
	document.body.innerHTML = '';
});

describe('ChatMessages Composer API - replaceText', () => {
	it('should place the cursor right after the mention when inserting at the start of the message', () => {
		const { composer, input } = setupComposer('@jhello', { start: 2, end: 2 });

		composer.replaceText('@john ', { start: 0, end: 2 });

		expect(input.value).toBe('@john hello');
		expect(input.selectionStart).toBe('@john '.length);
		expect(input.selectionEnd).toBe('@john '.length);
	});

	it('should place the cursor right after the mention when inserting in the middle of the message', () => {
		const { composer, input } = setupComposer('hi @jthere', { start: 5, end: 5 });

		composer.replaceText('@john ', { start: 3, end: 5 });

		expect(input.value).toBe('hi @john there');
		expect(input.selectionStart).toBe('hi @john '.length);
		expect(input.selectionEnd).toBe('hi @john '.length);
	});

	it('should place the cursor right after the mention when inserting at the end of the message', () => {
		const { composer, input } = setupComposer('hello @j', { start: 8, end: 8 });

		composer.replaceText('@john ', { start: 6, end: 8 });

		expect(input.value).toBe('hello @john ');
		expect(input.selectionStart).toBe('hello @john '.length);
		expect(input.selectionEnd).toBe('hello @john '.length);
	});

	it('should keep the cursor collapsed right after the inserted text', () => {
		const { composer, input } = setupComposer('@jhello', { start: 2, end: 2 });

		composer.replaceText('@john ', { start: 0, end: 2 });

		expect(input.selectionStart).toBe(input.selectionEnd);
	});
});
