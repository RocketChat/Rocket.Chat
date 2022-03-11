import { Box } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React from 'react';

import NotAvailable from '.';

export const NotAvailableOnCall: Story = () => (
	<Box h='44px' borderColor='disabled' borderWidth='2px'>
		<NotAvailable>
			<NotAvailable.Content icon='message' text='Messages are not available on phone calls' />
		</NotAvailable>
	</Box>
);

export default {
	title: 'components/Composer',
	component: NotAvailable,
};
