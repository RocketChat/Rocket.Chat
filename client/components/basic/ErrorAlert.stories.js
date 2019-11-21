import React from 'react';

import { ErrorAlert } from './ErrorAlert';

export default {
	title: 'basic/ErrorAlert',
	component: ErrorAlert,
};

export const _default = () => <ErrorAlert>Content</ErrorAlert>;

export const withTitle = () => <ErrorAlert title='Title'>Content</ErrorAlert>;
