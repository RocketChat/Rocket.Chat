import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react';

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [...decorators],
};

export default preview;
