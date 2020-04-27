import { withKnobs } from '@storybook/addon-knobs';
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport/dist/defaults';
import { addDecorator, addParameters, configure } from '@storybook/react';

import { rocketChatDecorator } from './mocks/decorators';

addParameters({
	viewport: {
		viewports: MINIMAL_VIEWPORTS,
	},
});

addDecorator(rocketChatDecorator);
addDecorator(withKnobs);

configure([
	require.context('../app', true, /\.stories\.js$/),
	require.context('../client', true, /\.stories\.js$/),
	require.context('../ee/app', true, /\.stories\.js$/),
], module);
