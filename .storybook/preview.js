import { withKnobs } from '@storybook/addon-knobs';
import { addDecorator, addParameters } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

addDecorator(rocketChatDecorator);
addDecorator(withKnobs);

addParameters({
	options: {
		showRoots: true,
	},
});
