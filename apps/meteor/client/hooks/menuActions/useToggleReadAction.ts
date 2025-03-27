import type { ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { useMarkAsUnreadMutation } from '../../components/message/hooks/useMarkAsUnreadMutation';

type ToggleReadActionProps = {
	rid: string;
	isUnread?: boolean;
	subscription?: ISubscription;
};

export const useToggleReadAction = ({ rid, isUnread, subscription }: ToggleReadActionProps) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const router = useRouter();

	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');

	const unreadMessages = useMarkAsUnreadMutation();

	const handleToggleRead = useEffectEvent(async () => {
		try {
			queryClient.invalidateQueries({
				queryKey: ['sidebar/search/spotlight'],
			});

			if (isUnread) {
				await readMessages({ rid, readThreads: true });
				return;
			}

			if (subscription == null) {
				return;
			}

			LegacyRoomManager.close(subscription.t + subscription.name);

			router.navigate('/home');

			await unreadMessages.mutateAsync({ roomId: rid, subscription });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleToggleRead;
};
