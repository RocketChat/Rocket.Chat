import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';

import { MessageTypes } from './MessageTypes';

let messageTypes: MessageTypes;
const baseMessage: IMessage = {
	rid: 'roomId',
	msg: 'message',
	ts: new Date(),
	u: { _id: 'userId', username: 'user' },
} as IMessage;

beforeEach(() => {
	messageTypes = new MessageTypes();
});

it('should register and retrieve a message type', () => {
	const type = {
		id: 'e2e' as MessageTypesValues,
		system: true,
		text: () => 'Test message',
	};
	messageTypes.registerType(type);
	const result = messageTypes.getType({ ...baseMessage, t: 'e2e' });
	expect(result).toEqual(type);
});

it('should return undefined for unknown type', () => {
	const result = messageTypes.getType({ ...baseMessage, t: undefined });
	expect(result).toBeUndefined();
});

it('should identify system messages', () => {
	const type = {
		id: 'e2e' as MessageTypesValues,
		system: true,
		text: () => 'System message',
	};
	messageTypes.registerType(type);
	expect(messageTypes.isSystemMessage({ ...baseMessage, t: 'e2e' })).toBe(true);
});

it('should identify non-system messages', () => {
	const type = {
		id: 'uj' as MessageTypesValues,
		system: false,
		text: () => 'User message',
	};
	messageTypes.registerType(type);
	expect(messageTypes.isSystemMessage({ ...baseMessage, t: 'uj' })).toBe(false);
});

it('should return false for isSystemMessage if type is not registered', () => {
	expect(messageTypes.isSystemMessage({ ...baseMessage, t: undefined })).toBe(false);
});
