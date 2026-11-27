import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ToastBarClose from './ToastBarClose';
import ToastBarIcon from './ToastBarIcon';
import ToastBarMessage from './ToastBarMessage';
import ToastBarProgress from './ToastBarProgress';
import ToastBarSurface from './ToastBarSurface';
import { Avatar } from '../Avatar';
import { ItemDescription, ItemLink, ItemMedia, ItemTitle } from '../Item';
import { leterAvatarUrls } from '../Sidebar/helpers';

export default {
	title: 'Feedback/ToastBar Composition',
	component: ToastBarSurface,
	subcomponents: { ToastBarIcon, ToastBarMessage, ToastBarClose, ToastBarProgress },
	parameters: {
		docs: {
			description: {
				component:
					'`ToastBar` is the default composition of these parts. Compose them directly when a toast needs other content, such as an avatar and a link.\n\n' +
					'- `ToastBarSurface` renders `Item` and draws the toast: tinted surface, elevation, radius and the stripe of its `variant`.\n' +
					'- `ToastBarIcon` shows the icon of the variant; use `ItemMedia` for any other media.\n' +
					'- `ToastBarMessage` is the `ItemContent` that announces the toast, assertively for `error`. It holds text or `ItemTitle`, `ItemLink` and `ItemDescription`.\n' +
					'- `ToastBarClose` is the dismiss button, inside `ItemActions`.\n' +
					'- `ToastBarProgress` is the bar along the bottom edge that fills in `time` seconds.',
			},
		},
	},
	argTypes: {
		variant: {
			control: 'select',
			options: [undefined, 'info', 'success', 'error'],
			description: 'Draws the stripe, picks the icon and sets the announcement role of the parts inside.',
		},
		is: {
			control: 'select',
			options: ['div', 'li'],
		},
	},
} satisfies Meta<typeof ToastBarSurface>;

type Story = StoryObj<typeof ToastBarSurface>;

export const IconMessageCloseProgress: Story = {
	name: 'Icon, message, close and progress',
	args: {
		variant: 'success',
	},
	render: (args) => (
		<ToastBarSurface {...args}>
			<ToastBarIcon />
			<ToastBarMessage>Link copied</ToastBarMessage>
			<ToastBarClose onClose={action('close')} />
			<ToastBarProgress />
		</ToastBarSurface>
	),
};

export const MessageOnly: Story = {
	name: 'Message only',
	render: (args) => (
		<ToastBarSurface {...args}>
			<ToastBarMessage>Reconnecting to the server…</ToastBarMessage>
		</ToastBarSurface>
	),
};

const AvatarLinkToast = ({ progress, ...args }: Story['args'] & { progress?: boolean }) => (
	<ToastBarSurface {...args}>
		<ItemMedia>
			<Avatar size='x36' url={leterAvatarUrls[1]} alt='' />
		</ItemMedia>
		<ToastBarMessage>
			<ItemTitle>
				<ItemLink is='button' onClick={action('open')}>
					Grace Hopper
				</ItemLink>
			</ItemTitle>
			<ItemDescription size='large'>Can you review the release notes before the call?</ItemDescription>
		</ToastBarMessage>
		<ToastBarClose onClose={action('close')} />
		{progress && <ToastBarProgress />}
	</ToastBarSurface>
);

export const AvatarLinkClose: Story = {
	name: 'Avatar, link and close',
	render: (args) => <AvatarLinkToast {...args} />,
};

export const AvatarLinkCloseProgress: Story = {
	name: 'Avatar, link, close and progress',
	render: (args) => <AvatarLinkToast {...args} progress />,
};
