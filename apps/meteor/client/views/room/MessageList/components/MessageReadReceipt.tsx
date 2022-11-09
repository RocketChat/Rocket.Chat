import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

const MessageReadReceipt = ({ unread }: { unread?: boolean }): ReactElement | null => (
	<Box
		position='absolute'
		className={css`
			top: 2px;
			right: 0.5rem;
		`}
	>
		<Icon name='check' size='x11' color={unread ? 'secondary' : 'primary'} />
	</Box>
);

export default MessageReadReceipt;
