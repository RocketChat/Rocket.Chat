import { withKnobs } from '@storybook/addon-knobs';
import { addDecorator } from '@storybook/react';

import { rocketChatDecorator } from './decorators';

addDecorator(rocketChatDecorator);
addDecorator(withKnobs);
