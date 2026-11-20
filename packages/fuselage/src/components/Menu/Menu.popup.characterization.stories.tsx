import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Menu, MenuItem } from '.';

// G0 characterization of the box Menu's popup opens in, which bounds its width; see src/testing/README.md. The popup
// renders in a portal, so the spec queries `document.body`.
export default {
	title: 'Characterization/Menu/Popup',
	component: Menu,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Menu>;

type Story = StoryObj<typeof Menu>;

// jsdom has no ResizeObserver, which the popover positioning reads, and no media queries, which pick the desktop popup
const stubResizeObserver = () => {
	window.ResizeObserver ??= class {
		observe = () => undefined;

		unobserve = () => undefined;

		disconnect = () => undefined;
	};
	window.matchMedia ??= (media: string) =>
		({ media, matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList;
};

export const PopupStructure: Story = {
	render: () => (
		<Menu title='Structure'>
			<MenuItem key='one'>One</MenuItem>
			<MenuItem key='two'>Two</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(within(canvasElement).getByRole('button'));
		const menu = await within(document.body).findByRole('menu');
		await expect(menu.closest('.rcx-menu__popover')).not.toBeNull();
		await expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
	},
};
