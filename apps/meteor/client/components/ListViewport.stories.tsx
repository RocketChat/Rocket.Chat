import { Contextualbar, ContextualbarContent, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';
import { Virtuoso } from 'react-virtuoso';

import ListViewport from './ListViewport';

const items = Array.from({ length: 200 }, (_, index) => `Item ${index + 1}`);

const meta = {
	component: ListViewport,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', height: '100vh' }}>
				<Contextualbar position='static'>
					<ContextualbarHeader>
						<ContextualbarTitle>List</ContextualbarTitle>
					</ContextualbarHeader>
					<ContextualbarContent flush>
						<Story />
					</ContextualbarContent>
				</Contextualbar>
			</div>
		),
	],
	args: {
		'aria-label': 'Items',
		'children': (
			<VirtualizedScrollbars>
				<Virtuoso
					style={{ height: '100%', width: '100%' }}
					data={items}
					itemContent={(_, item) => <div style={{ padding: '8px 24px' }}>{item}</div>}
				/>
			</VirtualizedScrollbars>
		),
	},
} satisfies Meta<typeof ListViewport>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
