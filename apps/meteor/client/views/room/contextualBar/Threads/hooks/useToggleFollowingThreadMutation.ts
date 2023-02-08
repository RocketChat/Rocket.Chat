import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRoom } from '../../../contexts/RoomContext';

// TODO: its core should be moved to the ChatContext

type UseToggleFollowingThreadMutationVariables = {
	tmid: IMessage['_id'];
	follow: boolean;
};

export const useToggleFollowingThreadMutation = (
	options?: Omit<UseMutationOptions<void, Error, UseToggleFollowingThreadMutationVariables>, 'mutationFn'>,
): UseMutationResult<void, Error, UseToggleFollowingThreadMutationVariables> => {
	const room = useRoom();
	const followMessage = useEndpoint('POST', '/v1/chat.followMessage');
	const unfollowMessage = useEndpoint('POST', '/v1/chat.unfollowMessage');

	const queryClient = useQueryClient();

	return useMutation(
		async ({ tmid, follow }) => {
			if (follow) {
				await followMessage({ mid: tmid });
				return;
			}

			await unfollowMessage({ mid: tmid });
		},
		{
			...options,
			onSuccess: async (data, variables, context) => {
				await queryClient.invalidateQueries(['rooms', room._id, 'threads']);
				return options?.onSuccess?.(data, variables, context);
			},
		},
	);
};
