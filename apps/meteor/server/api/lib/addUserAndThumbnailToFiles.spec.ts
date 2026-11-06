import { Uploads, Users } from '@rocket.chat/models';

import { addUserAndThumbnailToFiles } from './addUserAndThumbnailToFiles';

jest.mock('@rocket.chat/models', () => ({
	Uploads: { findThumbnailsByOriginalFileIds: jest.fn() },
	Users: { findByIds: jest.fn() },
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(Users.findByIds).mockReturnValue({ toArray: async () => [] } as never);
});

it('adds thumbnail paths from the same room and keeps the original when none matches', async () => {
	jest.mocked(Uploads.findThumbnailsByOriginalFileIds).mockReturnValue({
		toArray: async () => [
			{ _id: 'thumb', originalFileId: 'image', rid: 'room', path: '/file-upload/thumb/photo.png' },
			{ _id: 'other', originalFileId: 'moved', rid: 'other-room', path: '/file-upload/other/photo.png' },
		],
	} as never);

	const files = await addUserAndThumbnailToFiles([
		{ _id: 'image', rid: 'room', typeGroup: 'image', path: '/file-upload/image/photo.png' },
		{ _id: 'moved', rid: 'room', typeGroup: 'image', path: '/file-upload/moved/photo.png' },
	] as never);

	expect(files).toEqual([
		{ _id: 'image', rid: 'room', typeGroup: 'image', path: '/file-upload/image/photo.png', thumbnailPath: '/file-upload/thumb/photo.png' },
		{ _id: 'moved', rid: 'room', typeGroup: 'image', path: '/file-upload/moved/photo.png' },
	]);
});

it('looks up thumbnails only for images', async () => {
	await addUserAndThumbnailToFiles([{ _id: 'doc', rid: 'room', typeGroup: 'application', path: '/file-upload/doc/a.pdf' }] as never);

	expect(Uploads.findThumbnailsByOriginalFileIds).not.toHaveBeenCalled();
});
