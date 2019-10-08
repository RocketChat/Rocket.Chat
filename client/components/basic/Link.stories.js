import React from 'react';

import { rocketChatWrapper } from '../../../.storybook/helpers';
import { Link } from './Link';

export default {
	title: 'basic/Link',
	component: Link,
	decorators: [
		rocketChatWrapper,
	],
};

export const _default = () => <Link href='#'>Link</Link>;

export const withTitle = () => <Link external href='#'>Content</Link>;
