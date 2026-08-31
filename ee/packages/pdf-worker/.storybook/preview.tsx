import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import '../../../../apps/meteor/app/theme/client/main.css';
import 'highlight.js/styles/github.css';
import logo from './logo.svg';

const preview: Preview = {
	parameters: {
		...parameters,
		darkMode: {
			...parameters.darkMode,
			dark: {
				...parameters.darkMode?.dark,
				brandImage: logo,
			},
			light: {
				...parameters.darkMode?.light,
				brandImage: logo,
			},
		},
	},
	decorators: [...decorators],
	tags: ['autodocs'],
};

export default preview;
