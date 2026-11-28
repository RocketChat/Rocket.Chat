import type { FileAttachmentProps, IMessage } from '@rocket.chat/core-typings';

import { processMessageUploads } from './processMessageUploads';
import { sdk } from '../../SDKClient';
import { e2e } from '../../e2ee/rocketchat.e2e';
import type { E2ERoom } from '../../e2ee/rocketchat.e2e.room';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';
import type { EncryptedUpload } from '../Upload';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { open: jest.fn(), close: jest.fn() }, GenericModal: jest.fn() }));
jest.mock('../../../../lib/i18n', () => ({ t: (key: string) => key }));
jest.mock('../../SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
jest.mock('../../e2ee/rocketchat.e2e', () => ({ e2e: { getInstanceByRoomId: jest.fn() } }));
jest.mock('../../toast', () => ({ dispatchToastMessage: jest.fn() }));

const mockedPost = jest.mocked(sdk.rest.post);
const mockedGetInstanceByRoomId = jest.mocked(e2e.getInstanceByRoomId);
const mockedDispatchToastMessage = jest.mocked(dispatchToastMessage);

const createEncryptedUpload = (file: File, imageDimensions?: { height: number; width: number }): EncryptedUpload => ({
	id: 'upload-id',
	file,
	url: '/file-upload/upload-id/photo',
	percentage: 100,
	encryptedFile: { file, key: {}, iv: 'iv', type: file.type, hash: 'hash' },
	metadataForEncryption: {},
	...(imageDimensions && { imageDimensions }),
});

const createChat = (upload: EncryptedUpload) =>
	({
		composer: {
			uploads: {
				get: () => [upload],
				setProcessingUploads: jest.fn(),
				removeUpload: jest.fn(),
			},
		},
	}) as unknown as ChatAPI;

const sendAndGetAttachment = async (upload: EncryptedUpload) => {
	const encryptMessageContent = jest.fn(async (content: { attachments?: FileAttachmentProps[] }) => content);
	mockedGetInstanceByRoomId.mockResolvedValue({
		shouldConvertSentMessages: jest.fn().mockResolvedValue(true),
		encryptMessageContent,
	} as unknown as E2ERoom);

	await processMessageUploads(createChat(upload), { _id: 'message-id', rid: 'rid', msg: '' } as IMessage);

	return encryptMessageContent.mock.calls.find(([content]) => content.attachments)?.[0].attachments?.[0];
};

afterEach(() => {
	jest.clearAllMocks();
});

describe('processMessageUploads', () => {
	it('should send the image with its dimensions when they were measured', async () => {
		const attachment = await sendAndGetAttachment(
			createEncryptedUpload(new File(['png'], 'photo.png', { type: 'image/png' }), { height: 480, width: 640 }),
		);

		expect(attachment).toMatchObject({ image_type: 'image/png', image_dimensions: { height: 480, width: 640 } });
		expect(mockedPost).toHaveBeenCalledWith('/v1/rooms.mediaConfirm/rid/upload-id', expect.anything());
		expect(mockedDispatchToastMessage).not.toHaveBeenCalled();
	});

	// HEIC photos from phones are image/* but most browsers can't decode them; the send must not be aborted.
	it('should send the image without dimensions when the browser could not decode it', async () => {
		const attachment = await sendAndGetAttachment(createEncryptedUpload(new File(['heic'], 'photo.heic', { type: 'image/heic' })));

		expect(attachment).toMatchObject({ image_url: '/file-upload/upload-id/photo', image_type: 'image/heic' });
		expect(attachment).not.toHaveProperty('image_dimensions');
		expect(mockedPost).toHaveBeenCalledWith('/v1/rooms.mediaConfirm/rid/upload-id', expect.anything());
		expect(mockedDispatchToastMessage).not.toHaveBeenCalled();
	});
});
