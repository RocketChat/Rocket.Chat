import React from 'react';

import { SetAvatar } from './SetAvatar';

export default {
	title: 'directory/table',
	component: SetAvatar,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};

export const _default = () => <SetAvatar />;
