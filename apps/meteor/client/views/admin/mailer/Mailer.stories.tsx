import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import MailerPage from './MailerPage';

export default {
	title: 'Admin/Mailer/Mailer',
	component: MailerPage,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof MailerPage>;

export const Default: ComponentStory<typeof MailerPage> = () => <MailerPage />;
Default.storyName = 'Mailer';
