import type { IMessage } from '@rocket.chat/core-typings';

import type { SetReactionChat } from './processSetReaction';
import type { SendMessageChat } from './sendMessage';

const message = {} as IMessage;

// Compiles only while the core chat types stay satisfiable without the web ChatAPI, with no cast.
const nativeSendChat = {
	composer: {
		clear: () => undefined,
		dismissAllQuotedMessages: async () => undefined,
		uploads: { get: () => [] },
		quotedMessages: { get: () => [] },
	},
	data: {
		composeMessage: async () => message,
		findMessageByID: async () => null,
		isSubscribedToRoom: async () => true,
		joinRoom: async () => undefined,
	},
	readStateManager: { clearUnreadMark: () => undefined },
	currentEditingMessage: { getMID: () => undefined, reset: async () => true, stop: async () => undefined },
	flows: { processMessageEditing: async () => false, requestMessageDeletion: async () => undefined },
} satisfies SendMessageChat;

const nativeReactionChat = {
	composer: { clear: () => undefined },
	data: { findLastMessage: async () => undefined },
} satisfies SetReactionChat;

describe('core chat types', () => {
	it('accept a chat object that carries only the members the cores call', () => {
		expect([nativeSendChat, nativeReactionChat]).toHaveLength(2);
	});
});
