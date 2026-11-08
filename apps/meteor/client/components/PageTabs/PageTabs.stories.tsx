import { Badge, Skeleton } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import PageTabs from './PageTabs';

const meta = {
	component: PageTabs,
} satisfies Meta<typeof PageTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

const Controlled = ({ items }: { items: Parameters<typeof PageTabs>[0]['items'] }) => {
	const [selected, setSelected] = useState(items[0].id);
	return <PageTabs items={items} selected={selected} onSelect={setSelected} />;
};

export const Default: Story = {
	args: {
		items: [
			{ id: 'channels', label: 'Channels' },
			{ id: 'users', label: 'Users' },
			{ id: 'teams', label: 'Teams' },
			{ id: 'external', label: 'External users', hidden: true },
		],
		selected: undefined,
		onSelect: () => undefined,
	},
	render: ({ items }) => <Controlled items={items} />,
};

export const WithCounters: Story = {
	args: {
		items: [
			{ id: 'all', label: 'All' },
			{ id: 'pending', label: 'Pending', counter: <Skeleton variant='circle' height='x16' width='x16' /> },
			{ id: 'users', label: 'Users', counter: <Badge>12</Badge> },
			{ id: 'messages', label: 'Messages', counter: <Badge>340</Badge>, disabled: true },
		],
		selected: undefined,
		onSelect: () => undefined,
	},
	render: ({ items }) => <Controlled items={items} />,
};
