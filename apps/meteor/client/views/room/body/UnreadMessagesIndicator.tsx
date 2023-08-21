import { Grid, GridItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../hooks/useTimeAgo';

type UnreadMessagesIndicatorProps = {
	count: number;
	since?: Date;
	onJumpButtonClick: () => void;
	onMarkAsReadButtonClick: () => void;
};

const UnreadMessagesIndicator = ({
	count,
	since,
	onJumpButtonClick,
	onMarkAsReadButtonClick,
}: UnreadMessagesIndicatorProps): ReactElement => {
	const t = useTranslation();
	const formatTimeAgo = useTimeAgo();

	return (
		<Grid color='pure-black' bg='status-background-info'>
			<GridItem is='button' fontWeight={700} onClick={onJumpButtonClick}>
				{t('Jump_to_first_unread')}
			</GridItem>
			<GridItem textAlign='center'>{t('S_new_messages_since_s', count, since ? formatTimeAgo(since) : undefined)}</GridItem>
			<GridItem textAlign='end' is='button' fontWeight={700} onClick={onMarkAsReadButtonClick}>
				{t('Mark_as_read')}
			</GridItem>
		</Grid>
	);
};

export default UnreadMessagesIndicator;
