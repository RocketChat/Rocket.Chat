import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';

type UnreadMessagesIndicatorProps = {
	count: number;
	since?: Date;
	onJumpButtonClick: () => void;
	onMarkAsReadButtonClick: () => void;
};

const unreadBarStyle = css`
	color: ${Palette.text['font-pure-black']};
	background-color: ${Palette.status['status-background-info']};

	text-align: center;
	text-transform: uppercase;

	& > button.mark-read {
		float: right;

		line-height: inherit;

		&:hover {
			cursor: pointer;
		}
	}

	& .unread-count {
		display: none;
	}

	& > button.jump-to {
		float: left;

		line-height: inherit;

		& .jump-to-small {
			display: none;

			line-height: inherit;
		}

		&:hover {
			cursor: pointer;
		}
	}
`;

const UnreadMessagesIndicator = ({
	count,
	since,
	onJumpButtonClick,
	onMarkAsReadButtonClick,
}: UnreadMessagesIndicatorProps): ReactElement => {
	const t = useTranslation();
	const formatTimeAgo = useTimeAgo();

	return (
		// <div className='unread-bar color-primary-action-color background-component-color'>
		<Box className={unreadBarStyle}>
			<button type='button' className='jump-to' onClick={onJumpButtonClick}>
				<span className='jump-to-large'>{t('Jump_to_first_unread')}</span>
				<span className='jump-to-small'>{t('Jump')}</span>
			</button>
			<span className='unread-count-since'>{t('S_new_messages_since_s', count, since ? formatTimeAgo(since) : undefined)}</span>
			<span className='unread-count'>{t('N_new_messages', count)}</span>
			<button type='button' className='mark-read' onClick={onMarkAsReadButtonClick}>
				{t('Mark_as_read')}
			</button>
		</Box>
		// </div>
	);
};

export default UnreadMessagesIndicator;
