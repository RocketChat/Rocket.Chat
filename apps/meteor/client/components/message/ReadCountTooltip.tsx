import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeUsername } from '../../../lib/utils/normalizeUsername';
import { MessageListContext } from './list/MessageListContext';

type ReadCountTooltipProps = {
	messageId: string;
	roomId: string;
	onTooltipMouseEnter: () => void;
	onTooltipMouseLeave: () => void;
};

export const ReadCountTooltip = ({
	messageId,
	roomId,
	onTooltipMouseEnter,
	onTooltipMouseLeave,
}: ReadCountTooltipProps): ReactElement => {
	const { t } = useTranslation();
	const { showRealName } = useContext(MessageListContext);

	const getMessageReaders = useEndpoint('GET', '/v1/chat.getMessageReaders');

	const queryKey = ['message-readers', roomId, messageId];

	const { data, isLoading } = useQuery({
		queryKey,
		queryFn: () => getMessageReaders({ messageId, limit: 50 }),
		staleTime: 15_000,
	});

	const readers = data?.readers ?? [];

	const labelFor = (reader: { name?: string; username?: string }) => {
		if (showRealName && reader.name) {
			return reader.name;
		}

		if (reader.username) {
			return normalizeUsername(reader.username);
		}

		return reader.name ?? t('Mentions_removed_user_label');
	};

	return (
		<Box
			maxWidth='x300'
			display='flex'
			flexDirection='column'
			gap={4}
			onMouseEnter={onTooltipMouseEnter}
			onMouseLeave={onTooltipMouseLeave}
			onWheel={(e): void => {
				e.stopPropagation();
			}}
			style={{ pointerEvents: 'auto', userSelect: 'text' }}
		>
			<Box fontScale='p2m' color='default'>
				{t('Read_by')}
			</Box>
			{isLoading && (
				<>
					<Skeleton width='x240' variant='text' />
					<Skeleton width='x200' variant='text' />
					<Skeleton width='x220' variant='text' />
				</>
			)}
			{!isLoading && readers.length > 0 && (
				<Box
					display='flex'
					flexDirection='column'
					gap={2}
					maxHeight='x120'
					minHeight={0}
					overflowY='auto'
					pis={4}
					onWheel={(e): void => {
						e.stopPropagation();
					}}
					style={{ overscrollBehavior: 'contain' }}
				>
					{readers.map((reader) => (
						<Box key={reader._id} fontScale='p2' title={reader.username ? `@${reader.username}` : undefined}>
							{labelFor(reader)}
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};
