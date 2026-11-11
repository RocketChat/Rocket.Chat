import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import SidepanelList from './SidepanelList';
import SidepanelListItem from './SidepanelListItem';

// G0 characterization of the props a virtualizer (react-virtuoso) gives the Sidepanel's `List` and `Item`.
export default {
	title: 'Characterization/Sidepanel',
	component: SidepanelList,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SidepanelList>;

type Story = StoryObj<typeof SidepanelList>;

export const VirtualizerProps: Story = {
	render: () => (
		<SidepanelList
			id='panel-list'
			data-testid='virtuoso-item-list'
			style={{ boxSizing: 'border-box', marginTop: 0, paddingTop: 120, paddingBottom: 40, visibility: 'visible' }}
		>
			<SidepanelListItem id='panel-row' style={{ overflowAnchor: 'none' }} data-index='3' data-known-size='44' data-item-index='3' />
		</SidepanelList>
	),
	play: async ({ canvasElement }) => {
		const list = canvasElement.querySelector('#panel-list') as HTMLElement;
		await expect(list).toHaveAttribute('data-testid', 'virtuoso-item-list');
		await expect(list.style.paddingTop).toBe('120px');
		await expect(list.style.paddingBottom).toBe('40px');
		await expect(list.style.marginTop).toBe('0px');
		await expect(list.style.boxSizing).toBe('border-box');
		await expect(list.style.visibility).toBe('visible');
		const row = canvasElement.querySelector('#panel-row') as HTMLElement;
		await expect(row).toHaveAttribute('role', 'listitem');
		await expect(row.style.overflowAnchor).toBe('none');
		await expect(row).toHaveAttribute('data-index', '3');
		await expect(row).toHaveAttribute('data-known-size', '44');
		await expect(row).toHaveAttribute('data-item-index', '3');
	},
};
