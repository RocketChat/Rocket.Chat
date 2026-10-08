import { parameters as baseParameters, decorators as baseDecorators } from '@rocket.chat/storybook-config/preview';
import type { Preview } from '@storybook/react-webpack5';

const preview: Preview = {
	parameters: { ...baseParameters },
	decorators: [...baseDecorators],
	tags: ['autodocs'],
};

export default preview;
