import { Emitter } from '@rocket.chat/emitter';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useFileUpload } from './useFileUpload';
import type { ChatAPI, ComposerAPI, UploadsAPI } from '../../../../lib/chats/ChatAPI';
import type { Upload } from '../../../../lib/chats/Upload';
import { ChatContext } from '../../contexts/ChatContext';

const createChat = () => {
	const events = new Emitter<{ change: void }>();
	const chat = {
		composer: undefined as ComposerAPI | undefined,
		action: {},
		setComposerAPI: (composer?: ComposerAPI) => {
			chat.composer = composer;
			events.emit('change');
		},
		subscribeToComposer: (callback: () => void) => events.on('change', callback),
	};
	return chat;
};

const createStore = (uploads: readonly Upload[]) => {
	const events = new Emitter<{ update: void }>();
	return {
		attach: jest.fn(),
		detach: jest.fn(),
		wipeFailedOnes: jest.fn(),
		get: () => uploads,
		getProcessingUploads: () => false,
		subscribe: (callback: () => void) => events.on('update', callback),
	} as unknown as UploadsAPI;
};

it('attaches the uploads of a composer set up after it mounts', () => {
	const chat = createChat();
	const upload: Upload = { id: 'file-1', file: new File([], 'photo.png'), url: '/file-upload/file-1/photo.png', percentage: 100 };
	const store = createStore([upload]);

	const { result, unmount } = renderHook(() => useFileUpload(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<ChatContext.Provider value={chat as unknown as ChatAPI}>{children}</ChatContext.Provider>
		),
	});

	expect(result.current.uploads).toHaveLength(0);

	act(() => chat.setComposerAPI({ uploads: store } as unknown as ComposerAPI));

	expect(store.attach).toHaveBeenCalledTimes(1);
	expect(result.current.uploads).toEqual([upload]);

	unmount();

	expect(store.detach).toHaveBeenCalledTimes(1);
});
