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

const createImage = (decodable: boolean) =>
	class {
		onload: (() => void) | null = null;

		onerror: (() => void) | null = null;

		height = 0;

		width = 0;

		set src(_: string) {
			setTimeout(() => {
				if (!decodable) {
					this.onerror?.();
					return;
				}
				this.height = 480;
				this.width = 640;
				this.onload?.();
			});
		}
	};

const createEncryptedUpload = (file: File): EncryptedUpload => ({
	id: 'upload-id',
	file,
	url: '/file-upload/upload-id/photo',
	percentage: 100,
	encryptedFile: { file, key: {}, iv: 'iv', type: file.type, hash: 'hash' },
	metadataForEncryption: {},
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

const sendAndGetAttachment = async (file: File) => {
	const encryptMessageContent = jest.fn(async (content: { attachments?: FileAttachmentProps[] }) => content);
	mockedGetInstanceByRoomId.mockResolvedValue({
		shouldConvertSentMessages: jest.fn().mockResolvedValue(true),
		encryptMessageContent,
	} as unknown as E2ERoom);

	await processMessageUploads(createChat(createEncryptedUpload(file)), { _id: 'message-id', rid: 'rid', msg: '' } as IMessage);

	return encryptMessageContent.mock.calls.find(([content]) => content.attachments)?.[0].attachments?.[0];
};

const originalImage = global.Image;
const originalCreateObjectURL = global.URL.createObjectURL;

beforeEach(() => {
	global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
});

afterEach(() => {
	global.Image = originalImage;
	global.URL.createObjectURL = originalCreateObjectURL;
	jest.clearAllMocks();
});

describe('processMessageUploads', () => {
	it('should send the image with its dimensions when the browser can decode it', async () => {
		global.Image = createImage(true) as unknown as typeof Image;

		const attachment = await sendAndGetAttachment(new File(['png'], 'photo.png', { type: 'image/png' }));

		expect(attachment).toMatchObject({ image_type: 'image/png', image_dimensions: { height: 480, width: 640 } });
		expect(mockedPost).toHaveBeenCalledWith('/v1/rooms.mediaConfirm/rid/upload-id', expect.anything());
		expect(mockedDispatchToastMessage).not.toHaveBeenCalled();
	});

	// HEIC photos from phones are image/* but most browsers can't decode them; the send must not be aborted.
	it('should send the image without dimensions when the browser cannot decode it', async () => {
		global.Image = createImage(false) as unknown as typeof Image;

		const attachment = await sendAndGetAttachment(new File(['heic'], 'photo.heic', { type: 'image/heic' }));

		expect(attachment).toMatchObject({ image_url: '/file-upload/upload-id/photo', image_type: 'image/heic' });
		expect(attachment).not.toHaveProperty('image_dimensions');
		expect(mockedPost).toHaveBeenCalledWith('/v1/rooms.mediaConfirm/rid/upload-id', expect.anything());
		expect(mockedDispatchToastMessage).not.toHaveBeenCalled();
	});
});
