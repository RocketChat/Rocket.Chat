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

const createEditing = () => {
	const events = new Emitter<{ change: void }>();
	let editing = false;
	return {
		get: () => editing,
		subscribe: (callback: () => void) => events.on('change', callback),
		set: (value: boolean) => {
			editing = value;
			events.emit('change');
		},
	};
};

const renderUseFileUpload = (chat: ReturnType<typeof createChat>) =>
	renderHook(() => useFileUpload(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<ChatContext.Provider value={chat as unknown as ChatAPI}>{children}</ChatContext.Provider>
		),
	});

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

	const { result, unmount } = renderUseFileUpload(chat);

	expect(result.current.uploads).toHaveLength(0);

	act(() => chat.setComposerAPI({ uploads: store, editing: createEditing() } as unknown as ComposerAPI));

	expect(store.attach).toHaveBeenCalledTimes(1);
	expect(result.current.uploads).toEqual([upload]);

	unmount();

	expect(store.detach).toHaveBeenCalledTimes(1);
});

it('puts the uploads aside while a message is edited, and brings them back once the edit ends', () => {
	const chat = createChat();
	const upload: Upload = { id: 'file-1', file: new File([], 'photo.png'), percentage: 40 };
	const editing = createEditing();
	chat.setComposerAPI({ uploads: createStore([upload]), editing } as unknown as ComposerAPI);

	const { result } = renderUseFileUpload(chat);
	expect(result.current).toMatchObject({ uploads: [upload], hasUploads: true, isUploading: true });

	act(() => editing.set(true));
	expect(result.current).toMatchObject({ uploads: [], hasUploads: false, isUploading: false });

	act(() => editing.set(false));
	expect(result.current.uploads).toEqual([upload]);
});

describe('isUploading', () => {
	const renderIsUploading = (upload: Pick<Upload, 'percentage' | 'url'>) => {
		const chat = createChat();
		chat.setComposerAPI({
			uploads: createStore([{ id: 'upload-id', file: new File([], 'file.txt'), ...upload }]),
			editing: createEditing(),
		} as unknown as ComposerAPI);

		return renderUseFileUpload(chat).result;
	};

	it('counts an upload at 100% as in progress until the server returns its url', () => {
		expect(renderIsUploading({ percentage: 100 }).current.isUploading).toBe(true);
	});

	it('counts an upload with its url as done', () => {
		expect(renderIsUploading({ percentage: 100, url: '/file-upload/file-id' }).current.isUploading).toBe(false);
	});
});
