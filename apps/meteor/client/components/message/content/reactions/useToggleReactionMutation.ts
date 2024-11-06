import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type UseToggleReactionMutationVariables = {
	mid: IMessage['_id'];
	reaction: string;
};

export const useToggleReactionMutation = (
	options?: Omit<UseMutationOptions<void, Error, UseToggleReactionMutationVariables>, 'mutationFn'>,
): UseMutationResult<void, Error, UseToggleReactionMutationVariables> => {
	const uid = useUserId();
	const reactToMessage = useEndpoint('POST', '/v1/chat.react');

	return useMutation({
		mutationFn: async ({ mid, reaction }) => {
			if (!uid) {
				throw new Error('Not logged in');
			}

			await reactToMessage({ messageId: mid, reaction });
		},

		...options,
	});
};
