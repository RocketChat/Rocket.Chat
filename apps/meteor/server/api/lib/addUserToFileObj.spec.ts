import { Uploads, Users } from '@rocket.chat/models';

import { addUserToFileObj } from './addUserToFileObj';

jest.mock('@rocket.chat/models', () => ({
	Uploads: { find: jest.fn() },
	Users: { findByIds: jest.fn() },
}));

it('adds matching thumbnail paths while preserving original files and falling back when none exists', async () => {
	jest.mocked(Users.findByIds).mockReturnValue({ toArray: async () => [] } as never);
	jest.mocked(Uploads.find).mockReturnValue({
		toArray: async () => [
			{ _id: 'thumb', originalFileId: 'image', rid: 'room', path: '/file-upload/thumb/photo.png' },
			{ _id: 'other', originalFileId: 'missing', rid: 'other-room', path: '/file-upload/other/photo.png' },
		],
	} as never);

	const files = await addUserToFileObj([
		{ _id: 'image', rid: 'room', path: '/file-upload/image/photo.png' },
		{ _id: 'missing', rid: 'room', path: '/file-upload/missing/photo.png' },
	] as never);

	expect(files).toEqual([
		{ _id: 'image', rid: 'room', path: '/file-upload/image/photo.png', thumbnailUrl: '/file-upload/thumb/photo.png' },
		{ _id: 'missing', rid: 'room', path: '/file-upload/missing/photo.png' },
	]);
});
