import { renderHook } from '@testing-library/react';

import { usePerformActionMutation } from './usePerformActionMutation';
import { mockMessageProviders } from '../../../../../../tests/utils/mockMessageProviders';

const renderMutation = () => {
	const { wrapper, interactions } = mockMessageProviders();
	const { result } = renderHook(() => usePerformActionMutation(), { wrapper });
	return { mutation: result.current, interactions };
};

it('should send the message of a sendMessage action (R7)', async () => {
	const { mutation, interactions } = renderMutation();

	await mutation.mutateAsync({ processingType: 'sendMessage', msg: 'hello' });

	expect(interactions.sendMessage).toHaveBeenCalledWith('hello');
});

it('should put the message of a respondWithMessage action in the composer (R7)', async () => {
	const { mutation, interactions } = renderMutation();

	await mutation.mutateAsync({ processingType: 'respondWithMessage', msg: 'hello' });

	expect(interactions.replyWith).toHaveBeenCalledWith('hello');
	expect(interactions.sendMessage).not.toHaveBeenCalled();
});

it('should quote the message of a respondWithQuotedMessage action (R7)', async () => {
	const { mutation, interactions } = renderMutation();

	await mutation.mutateAsync({ processingType: 'respondWithQuotedMessage', mid: 'message-id' });

	expect(interactions.quoteMessageById).toHaveBeenCalledWith('message-id');
});

it.each([
	['sendMessage', 'sendMessage'],
	['respondWithMessage', 'replyWith'],
] as const)('should do nothing for a %s action with no message (R7)', async (processingType, capability) => {
	const { mutation, interactions } = renderMutation();

	await mutation.mutateAsync({ processingType });

	expect(interactions[capability]).not.toHaveBeenCalled();
});

it('should do nothing for a respondWithQuotedMessage action with no message id (R7)', async () => {
	const { mutation, interactions } = renderMutation();

	await mutation.mutateAsync({ processingType: 'respondWithQuotedMessage' });

	expect(interactions.quoteMessageById).not.toHaveBeenCalled();
});
