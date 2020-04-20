import React from 'react';

import { Link } from './Link';

export default {
	title: 'basic/Link',
	component: Link,
};

export const _default = () => <Link href='#'>Link</Link>;

export const withTitle = () => <Link external href='#'>Content</Link>;
