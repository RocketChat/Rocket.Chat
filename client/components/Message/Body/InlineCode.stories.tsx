import { Plain } from '@rocket.chat/message-parser';
import { Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import InlineCode from './InlineCode';

export default {
	title: 'Message/Body/InlineCode',
	component: InlineCode,
	decorators: [(storyFn: any): ReactElement => storyFn()],
};

const defaultValue: Plain = {
	type: 'PLAIN_TEXT',
	value: 'Test inline code',
};

export const Default = (): Story => <InlineCode value={defaultValue} />;
