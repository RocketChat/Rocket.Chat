import { Story } from '@storybook/react';
import React from 'react';

import Logo from './Logo';

export default {
	title: 'Components/Logo',
	component: Logo,
};

export const Default: Story = () => <Logo />;
Default.storyName = 'Logo';
