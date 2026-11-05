import { deleteHeldFiles } from './heldFiles';

const deleteById = jest.fn();

jest.mock('../../lib/media/file-upload', () => ({
	FileUpload: { getStore: () => ({ deleteById: (...args: unknown[]) => deleteById(...args) }) },
}));

describe('deleteHeldFiles', () => {
	it('deletes the other held files when one is already gone', async () => {
		deleteById.mockImplementation(async (_id: string) => {
			if (_id === 'gone') {
				throw new Error('File not found for id gone');
			}
		});

		await expect(
			deleteHeldFiles([
				{ _id: 'gone', name: 'a.png' },
				{ _id: 'f2', name: 'b.png' },
			]),
		).resolves.toBeUndefined();
		expect(deleteById).toHaveBeenCalledWith('f2');
	});
});
