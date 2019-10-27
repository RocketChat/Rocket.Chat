import React from 'react';

import { rocketChatWrapper } from '../../../.storybook/helpers';
import { ErrorAlert } from './ErrorAlert';

export default {
	title: 'basic/ErrorAlert',
	component: ErrorAlert,
	decorators: [
		rocketChatWrapper,
	],
};

export const _default = () => <ErrorAlert>Content</ErrorAlert>;

export const withTitle = () => <ErrorAlert title='Title'>Content</ErrorAlert>;
