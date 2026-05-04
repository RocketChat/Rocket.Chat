import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useTooltipClose, useTooltipOpen, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';

import { ReadCountTooltip } from './ReadCountTooltip';

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
	const ref = useRef<HTMLDivElement>(null);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const getMessageReadCount = useEndpoint('GET', '/v1/chat.getMessageReadCount');

	const queryKey = ['read-count', roomId, messageId];

	const shouldFetch = Boolean(uid && uid === senderId && room.t !== 'd');

	const { data } = useQuery({
		queryKey,
		queryFn: () => getMessageReadCount({ messageId }),
		staleTime: 15_000,
		enabled: shouldFetch,
	});

	useEffect(() => {
		const handler = (event: Event) => {
			const { detail } = event as CustomEvent<{ rid?: string }>;
			if (!detail?.rid || detail.rid !== roomId) {
				return;
			}

			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({ queryKey: ['message-readers', roomId, messageId] });
		};

		window.addEventListener('read-counts-changed', handler as EventListener);
		return () => window.removeEventListener('read-counts-changed', handler as EventListener);
	}, [queryClient, queryKey, roomId, messageId]);

	const readCount = data?.readCount ?? 0;

	// Keep this minimal: show only on the current user's own messages.
	if (!uid || uid !== senderId) {
		return null;
	}

	// Exclude DMs
	if (room.t === 'd') {
		return null;
	}

	if (readCount <= 0) {
		return null;
	}

	return (
		<Box
			ref={ref}
			display='inline-flex'
			alignItems='center'
			alignSelf='flex-start'
			width='max-content'
			maxWidth='100%'
			flexShrink={0}
			fontSize='x12'
			color='hint'
			data-tooltip=''
			aria-label={`${t('Read_by')} ${readCount}`}
			onMouseEnter={(e): void => {
				e.stopPropagation();
				e.preventDefault();

				ref.current &&
					openTooltip(<ReadCountTooltip messageId={messageId} roomId={roomId} />, ref.current);
			}}
			onMouseLeave={(): void => {
				closeTooltip();
			}}
		>
			<Icon name='eye' size='x12' mie={4} />
			{readCount}
		</Box>
	);
};

