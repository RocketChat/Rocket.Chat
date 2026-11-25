import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import GenericMenu from './GenericMenu';

const PHONE_VIEWPORTS = {
	phone: { name: 'Phone', styles: { width: '375px', height: '812px' } },
} as const;

const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Options' }));
};

const openSubMenu =
	(name: string) =>
	async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await openMenu({ canvasElement });
		await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name }));
	};

const flatItems = [
	{ id: 'edit', icon: 'pencil' as const, content: 'Edit', onClick: action('edit') },
	{ id: 'share', icon: 'share' as const, content: 'Share', onClick: action('share') },
];

const shareItem = {
	id: 'share',
	icon: 'share' as const,
	content: 'Share',
	items: [
		{ id: 'copy', icon: 'copy' as const, content: 'Copy link', onClick: action('copy') },
		{ id: 'email', icon: 'mail' as const, content: 'Email', onClick: action('email') },
	],
};

const meta = {
	component: GenericMenu,
	args: {
		title: 'Options',
		icon: 'kebab',
		callbackAction: action('callbackAction'),
	},
	play: openMenu,
} satisfies Meta<typeof GenericMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { items: flatItems },
};

export const WithSubMenu: Story = {
	args: {
		items: [{ id: 'edit', icon: 'pencil', content: 'Edit', onClick: action('edit') }, shareItem],
	},
	play: openSubMenu('Share'),
};

export const WithSubMenuInSections: Story = {
	args: {
		sections: [
			{ items: [{ id: 'edit', icon: 'pencil', content: 'Edit', onClick: action('edit') }] },
			{
				title: 'Links',
				items: [
					{
						id: 'weekly',
						content: 'Weekly sync',
						items: [
							{ id: 'weekly-open', icon: 'new-window', content: 'Open', onClick: action('open') },
							{ id: 'weekly-archive', icon: 'arrow-down-box', content: 'Archive', disabled: true, onClick: action('archive') },
							{ id: 'weekly-delete', icon: 'trash', content: 'Delete', variant: 'danger', onClick: action('delete') },
						],
					},
				],
			},
		],
	},
	play: openSubMenu('Weekly sync'),
};

export const WithStatusOnTrigger: Story = {
	args: {
		sections: [
			{
				title: 'Links',
				items: [
					{
						id: 'standup',
						content: 'Daily standup',
						status: 'Live',
						items: [{ id: 'standup-join', icon: 'phone', content: 'Join', onClick: action('join') }],
					},
				],
			},
		],
	},
};

export const OnPhone: Story = {
	args: {
		items: [{ id: 'edit', icon: 'pencil', content: 'Edit', onClick: action('edit') }, shareItem],
	},
	parameters: { viewport: { options: PHONE_VIEWPORTS } },
	globals: { viewport: { value: 'phone', isRotated: false } },
	play: openSubMenu('Share'),
};
