import React from 'react';

import { rocketChatWrapper } from '../../../.storybook/helpers';
import { Button } from './Button';

export default {
	title: 'basic/Button',
	component: Button,
	decorators: [
		rocketChatWrapper,
	],
};

export const _default = () => <Button>Button</Button>;

export const invisible = () => <Button invisible>Button</Button>;

export const primary = () => <Button primary>Button</Button>;

export const secondary = () => <Button secondary>Button</Button>;
