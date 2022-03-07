import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useSetting } from '../../../../contexts/SettingsContext';

const MessageReadReceipt = (): ReactElement | null => {
	const isReadReceiptEnabled = useSetting('Message_Read_Receipt_Enabled');

	if (!isReadReceiptEnabled) {
		return null;
	}

	return (
		<Box
			position='absolute'
			className={css`
				top: 2px;
				right: 0.5rem;
			`}
		>
			<Icon name='check' size='x11' color='primary' />
		</Box>
	);
};

export default MessageReadReceipt;
