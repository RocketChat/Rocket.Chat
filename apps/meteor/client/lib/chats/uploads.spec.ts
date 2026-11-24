import { createUploadsAPI } from './uploads';
import { sdk } from '../SDKClient';

jest.mock('../SDKClient', () => ({ sdk: { rest: { upload: jest.fn() } } }));

type UploadHandlers = { progress: (event: Partial<ProgressEvent>) => void };

const startUpload = () => {
	const xhr = new XMLHttpRequest();
	jest.spyOn(xhr, 'readyState', 'get').mockReturnValue(xhr.DONE);
	let handlers: UploadHandlers | undefined;
	jest.mocked(sdk.rest.upload).mockImplementation((_endpoint, _params, events) => {
		handlers = events as UploadHandlers;
		return xhr;
	});

	const uploads = createUploadsAPI({ rid: 'room-id' });
	void uploads.send(new File(['content'], 'file.txt', { type: 'text/plain' }));

	return { uploads, xhr, progress: (loaded: number) => handlers?.progress({ lengthComputable: true, loaded, total: 100 }) };
};

describe('uploads', () => {
	it('should keep the upload below 100% after all bytes are sent and before the server answers', () => {
		const { uploads, progress } = startUpload();

		progress(100);

		expect(uploads.get()[0]).toMatchObject({ percentage: 99 });
		expect(uploads.get()[0]).not.toHaveProperty('url');
	});

	it('should complete the upload with the file URL when the server accepts the file', () => {
		const { uploads, xhr, progress } = startUpload();
		progress(100);

		jest.spyOn(xhr, 'status', 'get').mockReturnValue(200);
		jest.spyOn(xhr, 'responseText', 'get').mockReturnValue(JSON.stringify({ file: { _id: 'file-id', url: '/file-upload/file-id' } }));
		xhr.dispatchEvent(new ProgressEvent('load'));

		expect(uploads.get()[0]).toMatchObject({ id: 'file-id', url: '/file-upload/file-id', percentage: 100 });
	});
});
