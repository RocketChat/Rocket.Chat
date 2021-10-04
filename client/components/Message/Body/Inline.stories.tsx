/* eslint-disable @typescript-eslint/explicit-function-return-type */
// eslint-disable-next-line import/no-unresolved
import { Plain } from '@rocket.chat/message-parser';
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

export const Default = () => <Inline value={[defaultValue]} />;
