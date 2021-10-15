import { Box } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React from 'react';

import NotAvailable from '.';

export const NotAvailableOnCall: Story = () => (
	<Box h='44px' border='solid #E4E7EA 2px'>
		<NotAvailable>
			<NotAvailable.Content icon='message' text='Composer_not_available_phone_calls' />
		</NotAvailable>
	</Box>
);

export default {
	title: 'components/Composer',
	component: NotAvailable,
};
