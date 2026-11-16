import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useFileUpload } from './useFileUpload';
import type { ChatAPI, ComposerAPI } from '../../../../lib/chats/ChatAPI';
import type { Upload } from '../../../../lib/chats/Upload';
import { ChatContext } from '../../contexts/ChatContext';

// A chat whose composer registers only when the test says, so the test controls when it appears
const createChat = () => {
	const listeners = new Set<() => void>();
	const chat = {
		composer: undefined as ComposerAPI | undefined,
		flows: { uploadFiles: jest.fn() },
		subscribeToComposer: (onChange: () => void) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		setComposerAPI: (composer?: ComposerAPI) => {
			chat.composer = composer;
			listeners.forEach((onChange) => onChange());
		},
	};
	return chat;
};

const createComposer = (uploads: readonly Upload[]) =>
	({
		uploads: {
			get: () => uploads,
			subscribe: () => () => undefined,
			getProcessingUploads: () => false,
			wipeFailedOnes: jest.fn(),
			clear: jest.fn(),
		},
	}) as unknown as ComposerAPI;

const uploading = { id: 'upload', file: new File([], 'file.txt'), percentage: 10 } as Upload;

it('shows the uploads of a composer that registers after the body rendered', () => {
	const chat = createChat();
	const { result } = renderHook(() => useFileUpload(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<ChatContext.Provider value={chat as unknown as ChatAPI}>{children}</ChatContext.Provider>
		),
	});
	expect(result.current.isUploading).toBe(false);

	act(() => chat.setComposerAPI(createComposer([uploading])));

	expect(result.current.uploads).toEqual([uploading]);
	expect(result.current.isUploading).toBe(true);
});
