import { ChatMessages } from './ChatMessages';
import type { ComposerAPI } from './chats/ChatAPI';

jest.mock('./chats/data', () => ({ createDataAPI: () => ({}) }));
jest.mock('./chats/readStateManager', () => ({ ReadStateManager: jest.fn() }));
jest.mock('./UserAction', () => ({ UserAction: {} }));
jest.mock('./chats/flows/processMessageEditing', () => ({ processMessageEditing: jest.fn() }));
jest.mock('./chats/flows/processMessageUploads', () => ({ processMessageUploads: jest.fn() }));
jest.mock('./chats/flows/processSetReaction', () => ({ processSetReaction: jest.fn() }));
jest.mock('./chats/flows/processSlashCommand', () => ({ processSlashCommand: jest.fn() }));
jest.mock('./chats/flows/processTooLongMessage', () => ({ processTooLongMessage: jest.fn() }));
jest.mock('./chats/flows/replyBroadcast', () => ({ replyBroadcast: jest.fn() }));
jest.mock('./chats/flows/requestMessageDeletion', () => ({ requestMessageDeletion: jest.fn() }));
jest.mock('./chats/flows/sendMessage', () => ({ sendMessage: jest.fn() }));
jest.mock('./chats/flows/uploadFiles', () => ({ uploadFiles: jest.fn() }));

const composer = () => ({ release: jest.fn() }) as unknown as ComposerAPI;

it('tells its subscribers when a composer registers and when it goes away', () => {
	const chat = new ChatMessages({ rid: 'room-id', uid: 'john.doe', actionManager: {} as never });
	const onChange = jest.fn(() => chat.composer);
	chat.subscribeToComposer(onChange);

	const first = composer();
	chat.setComposerAPI(first);
	chat.setComposerAPI();

	expect(onChange.mock.results.map(({ value }) => value)).toEqual([first, undefined]);
	expect(first.release).toHaveBeenCalledTimes(1);
});

it('stops telling a subscriber that unsubscribed', () => {
	const chat = new ChatMessages({ rid: 'room-id', uid: 'john.doe', actionManager: {} as never });
	const onChange = jest.fn();
	const unsubscribe = chat.subscribeToComposer(onChange);

	unsubscribe();
	chat.setComposerAPI(composer());

	expect(onChange).not.toHaveBeenCalled();
});
