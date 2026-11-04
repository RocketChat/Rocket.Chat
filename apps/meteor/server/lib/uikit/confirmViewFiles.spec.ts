import { confirmViewFiles } from './confirmViewFiles';

const mockConfirmTemporaryFile = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Uploads: { confirmTemporaryFile: (...args: unknown[]) => mockConfirmTemporaryFile(...args) },
}));

const fileInput = (overrides: Record<string, unknown> = {}) => ({
	type: 'input',
	blockId: 'block',
	label: { type: 'plain_text', text: 'Files' },
	element: { type: 'file_input', actionId: 'files', ...overrides },
});

beforeEach(() => {
	mockConfirmTemporaryFile.mockReset();
});

it('confirms the files listed in the state of a file_input, for the submitting user', async () => {
	await confirmViewFiles({ blocks: [fileInput()], state: { block: { files: ['a', 'b'] } } }, 'user');

	expect(mockConfirmTemporaryFile.mock.calls).toEqual([
		['a', 'user'],
		['b', 'user'],
	]);
});

it('reads the block id from the element when it carries its own', async () => {
	await confirmViewFiles({ blocks: [fileInput({ blockId: 'own' })], state: { own: { files: ['a'] } } }, 'user');

	expect(mockConfirmTemporaryFile).toHaveBeenCalledWith('a', 'user');
});

it('confirms each file once and ignores values that are not file ids', async () => {
	await confirmViewFiles({ blocks: [fileInput()], state: { block: { files: ['a', 'a', 7, null] } } }, 'user');

	expect(mockConfirmTemporaryFile).toHaveBeenCalledTimes(1);
});

it('does not confirm more files than the element allows', async () => {
	await confirmViewFiles({ blocks: [fileInput({ max_files: 1 })], state: { block: { files: ['a', 'b'] } } }, 'user');

	expect(mockConfirmTemporaryFile.mock.calls).toEqual([['a', 'user']]);
});

it('ignores state of elements that are not file inputs', async () => {
	const blocks = [{ type: 'input', blockId: 'block', element: { type: 'plain_text_input', actionId: 'files' } }];

	await confirmViewFiles({ blocks, state: { block: { files: ['a'] } } }, 'user');

	expect(mockConfirmTemporaryFile).not.toHaveBeenCalled();
});

it('confirms nothing for a visitor', async () => {
	await confirmViewFiles({ blocks: [fileInput()], state: { block: { files: ['a'] } } }, undefined);

	expect(mockConfirmTemporaryFile).not.toHaveBeenCalled();
});
