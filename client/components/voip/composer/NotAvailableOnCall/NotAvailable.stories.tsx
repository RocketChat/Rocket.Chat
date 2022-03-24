import { Story } from '@storybook/react';
import React from 'react';

import NotAvailableContent from './NotAvailableContent';
import NotAvailableContentWrapper from './NotAvailableContentWrapper';

export const Default: Story = () => (
	<NotAvailableContentWrapper>
		<NotAvailableContent text='Messages are not available on phone calls' icon='message' />
	</NotAvailableContentWrapper>
);

export default {
	title: 'components/Composer/NotAvailableOnCall',
	component: Default,
};
