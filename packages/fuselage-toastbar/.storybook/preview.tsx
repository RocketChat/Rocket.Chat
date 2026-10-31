import { parameters as baseParameters, decorators as baseDecorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react-webpack5';

import ToastBarProvider from '../src/ToastBarProvider';

const preview: Preview = {
	parameters: { ...baseParameters },
	decorators: [
		...baseDecorators,
		(Story) => (
			<ToastBarProvider>
				<Story />
			</ToastBarProvider>
		),
	],
	tags: ['autodocs'],
};

export default preview;
