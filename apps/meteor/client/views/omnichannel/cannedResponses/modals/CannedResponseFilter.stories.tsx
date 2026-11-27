import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import CannedResponseFilter from './CannedResponseFilter';

export default {
	component: CannedResponseFilter,
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/v1/livechat/users/agent', () => ({ users: [], count: 0, offset: 0, total: 0 }))
			.buildStoryDecorator(),
		(Story) => (
			<Box maxWidth='x900'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof CannedResponseFilter>;

export const Default: StoryFn<typeof CannedResponseFilter> = () => {
	const [text, setText] = useState('');
	const [sharing, setSharing] = useState<'' | 'user' | 'global' | 'department'>('');
	const [createdBy, setCreatedBy] = useState('all');

	return (
		<CannedResponseFilter
			text={text}
			setText={setText}
			sharing={sharing}
			setSharing={setSharing}
			createdBy={createdBy}
			setCreatedBy={setCreatedBy}
		/>
	);
};
