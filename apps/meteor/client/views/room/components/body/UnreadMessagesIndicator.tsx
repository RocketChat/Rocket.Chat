import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';

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
		<div className='unread-bar color-primary-action-color background-component-color'>
			<button type='button' className='jump-to' onClick={onJumpButtonClick}>
				<span className='jump-to-large'>{t('Jump_to_first_unread')}</span>
				<span className='jump-to-small'>{t('Jump')}</span>
			</button>
			<span className='unread-count-since'>{t('S_new_messages_since_s', count, since ? formatTimeAgo(since) : undefined)}</span>
			<span className='unread-count'>{t('N_new_messages', count)}</span>
			<button type='button' className='mark-read' onClick={onMarkAsReadButtonClick}>
				{t('Mark_as_read')}
			</button>
		</div>
	);
};

export default UnreadMessagesIndicator;
