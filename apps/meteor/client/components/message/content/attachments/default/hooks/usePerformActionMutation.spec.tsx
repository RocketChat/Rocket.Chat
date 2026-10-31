import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ContextType } from 'react';

import { usePerformActionMutation } from './usePerformActionMutation';
import { createFakeMessage } from '../../../../../../../tests/mocks/data';
import { ChatContext } from '../../../../../../views/room/contexts/ChatContext';

const sendMessage = jest.fn();
const replyWith = jest.fn();
const quoteMessage = jest.fn();
const getMessageByID = jest.fn();

const chat = {
	flows: { sendMessage },
	composer: { replyWith, quoteMessage },
	data: { getMessageByID },
} as unknown as ContextType<typeof ChatContext>;

const renderMutation = ({ chatValue }: { chatValue?: ContextType<typeof ChatContext> } = { chatValue: chat }) =>
	renderHook(() => usePerformActionMutation(), {
		wrapper: mockAppRoot()
			.wrap((children) => <ChatContext.Provider value={chatValue}>{children}</ChatContext.Provider>)
			.build(),
	}).result.current;

describe('usePerformActionMutation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should send the message of a sendMessage action', async () => {
		await renderMutation().mutateAsync({ processingType: 'sendMessage', msg: 'hello' });

		expect(sendMessage).toHaveBeenCalledWith({ text: 'hello' });
	});

	it('should put the message of a respondWithMessage action in the composer', async () => {
		await renderMutation().mutateAsync({ processingType: 'respondWithMessage', msg: 'hello' });

		expect(replyWith).toHaveBeenCalledWith('hello');
		expect(sendMessage).not.toHaveBeenCalled();
	});

	it('should quote the message of a respondWithQuotedMessage action', async () => {
		const message = createFakeMessage({ _id: 'message-id' });
		getMessageByID.mockResolvedValue(message);

		await renderMutation().mutateAsync({ processingType: 'respondWithQuotedMessage', mid: 'message-id' });

		expect(getMessageByID).toHaveBeenCalledWith('message-id');
		expect(quoteMessage).toHaveBeenCalledWith(message);
	});

	it.each([
		['sendMessage', sendMessage],
		['respondWithMessage', replyWith],
	] as const)('should do nothing for a %s action with no message', async (processingType, action) => {
		await renderMutation().mutateAsync({ processingType });

		expect(action).not.toHaveBeenCalled();
	});

	it('should do nothing for a respondWithQuotedMessage action with no message id', async () => {
		await renderMutation().mutateAsync({ processingType: 'respondWithQuotedMessage' });

		expect(getMessageByID).not.toHaveBeenCalled();
	});

	it('should do nothing outside a room', async () => {
		await renderMutation({}).mutateAsync({ processingType: 'sendMessage', msg: 'hello' });

		expect(sendMessage).not.toHaveBeenCalled();
	});
});
