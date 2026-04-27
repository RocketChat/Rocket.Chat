import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';

type ReadCountBadgeProps = {
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	senderId: string;
};

export const ReadCountBadge = ({ messageId, roomId, senderId }: ReadCountBadgeProps): ReactElement | null => {
	const uid = useUserId();
	const room = useRoom();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// Keep this minimal: show only on the current user's own messages.
	if (!uid || uid !== senderId) {
		return null;
	}

	// Exclude DMs
	if (room.t === 'd') {
		return null;
	}

	const getMessageReadCount = useEndpoint('GET', '/v1/chat.getMessageReadCount');

	const queryKey = ['read-count', roomId, messageId];

	const { data } = useQuery({
		queryKey,
		queryFn: () => getMessageReadCount({ messageId }),
		staleTime: 15_000,
	});

	useEffect(() => {
		const handler = (event: Event) => {
			const { detail } = event as CustomEvent<{ rid?: string }>;
			if (!detail?.rid || detail.rid !== roomId) {
				return;
			}

			queryClient.invalidateQueries({ queryKey });
		};

		window.addEventListener('read-counts-changed', handler as EventListener);
		return () => window.removeEventListener('read-counts-changed', handler as EventListener);
	}, [queryClient, queryKey, roomId]);

	const readCount = data?.readCount ?? 0;

	if (readCount <= 0) {
		return null;
	}

	return (
		<Box
			display='inline-flex'
			alignItems='center'
			fontSize='x12'
			color='hint'
			title={`${t('Read_by')} ${readCount}`}
			aria-label={`${t('Read_by')} ${readCount}`}
		>
			<Icon name='eye' size='x12' mie={4} />
			{readCount}
		</Box>
	);
};

