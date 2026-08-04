import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

import DefaultBodySize from './DefaultBodySize';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators, DefaultBodySize],
};

export default preview;
