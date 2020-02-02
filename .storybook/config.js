import { withKnobs } from '@storybook/addon-knobs';
import { MINIMAL_VIEWPORTS, INITIAL_VIEWPORTS } from '@storybook/addon-viewport/dist/defaults';
import { addDecorator, addParameters, configure } from '@storybook/react';

import { rocketChatDecorator } from './mocks/decorators';

addParameters({
	viewport: {
		viewports: {
			...MINIMAL_VIEWPORTS,
			...INITIAL_VIEWPORTS,
		},
		defaultViewport: 'responsive',
	},
});

addDecorator(rocketChatDecorator);
addDecorator(withKnobs);

configure(require.context('../client', true, /\.stories\.js$/), module);
