import { Plain } from '@rocket.chat/message-parser';
import { Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import Inline from './Inline';

export default {
	title: 'Message/Body/Inline',
	component: Inline,
	decorators: [(storyFn: any): ReactElement => storyFn()],
};

const defaultValue: Plain = {
	type: 'PLAIN_TEXT',
	value: 'Test inline',
};

export const Default = (): Story => <Inline value={[defaultValue]} />;
