import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const MessageReadReceipt = ({ unread }: { unread?: boolean }): ReactElement | null => (
	<Box
		position='absolute'
		className={css`
			top: 2px;
			right: 0.5rem;
		`}
	>
		<Icon name='check' size='x16' color={unread ? 'annotation' : 'on-info'} />
	</Box>
);

export default MessageReadReceipt;
