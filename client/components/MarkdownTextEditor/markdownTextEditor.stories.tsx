import { action } from '@storybook/addon-actions';
import React from 'react';

import MarkdownTextEditor from './index';

export default {
	title: 'components/MarkdownTextEditor',
	component: MarkdownTextEditor,
};

export const render = (): any => (
	<MarkdownTextEditor onChange={action('OnChangeCalled')} value={'Initial Value'} />
);
