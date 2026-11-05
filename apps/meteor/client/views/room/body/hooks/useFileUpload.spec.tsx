import { act, renderHook } from '@testing-library/react';

import { useFileUpload } from './useFileUpload';
import type { ChatAPI, UploadsAPI } from '../../../../lib/chats/ChatAPI';
import type { Upload } from '../../../../lib/chats/Upload';
import { createUploadsAPI } from '../../../../lib/chats/uploads';
import { ChatContext } from '../../contexts/ChatContext';

const renderIsUploading = (upload: { percentage: number; url?: string }) => {
	const uploads = createUploadsAPI({ rid: 'room-id' }) as UploadsAPI & { set(uploads: Upload[]): void };
	const chat = { composer: { uploads }, flows: {} } as unknown as ChatAPI;

	const { result } = renderHook(() => useFileUpload(), {
		wrapper: ({ children }) => <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>,
	});
	act(() => uploads.set([{ id: 'upload-id', file: new File([], 'file.txt'), ...upload }]));

	return result;
};

describe('useFileUpload', () => {
	it('should count an upload at 100% as in progress until the server returns its URL', () => {
		expect(renderIsUploading({ percentage: 100 }).current.isUploading).toBe(true);
	});

	it('should count an upload with its URL as done', () => {
		expect(renderIsUploading({ percentage: 100, url: '/file-upload/file-id' }).current.isUploading).toBe(false);
	});
});
