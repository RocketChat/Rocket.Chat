import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type UnreadMessagesIndicatorProps = {
	count: number;
	onJumpButtonClick: () => void;
	onMarkAsReadButtonClick: () => void;
};

const indicatorStyle = css`
	position: absolute;
	top: 8px;
	left: 50%;
	translate: -50%;
	z-index: 10;
`;

const UnreadMessagesIndicator = ({ count, onJumpButtonClick, onMarkAsReadButtonClick }: UnreadMessagesIndicatorProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box className={indicatorStyle}>
			<Bubble
				onClick={onJumpButtonClick}
				onDismiss={onMarkAsReadButtonClick}
				icon='arrow-up'
				dismissProps={{ 'title': t('Mark_as_read'), 'aria-label': `${t('Mark_as_read')}` }}
			>
				{t('S_new_messages', count)}
			</Bubble>
		</Box>
	);
};

export default UnreadMessagesIndicator;
