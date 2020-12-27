import React from 'react';

import Logo from './Logo';

export default {
	title: 'components/Logo',
	component: Logo,
	argTypes: {
		src: {
			control: 'text',
		},
	},
};

export const _Logo = (args) => <Logo {...args} />;
_Logo.storyName = 'Logo';
