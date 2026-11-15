import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { action } from 'storybook/actions';

import {
	Header,
	HeaderPicture,
	HeaderContent,
	HeaderSubTitle,
	HeaderTitle,
	HeaderActions,
	HeaderAction,
	HeaderPost,
	HeaderCustomField,
} from '.';
import { gazzoAvatar } from '../../../.storybook/helpers';
import Arrow from '../../icons/arrowDown.svg';
import Bell from '../../icons/bell.svg';
import NewWindow from '../../icons/newWindow.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';

export default {
	component: Header,
	args: {
		theme: {
			color: '',
			fontColor: '',
		},
		onClick: action('clicked'),
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof Header>>;

type Story = StoryObj<ComponentProps<typeof Header>>;

export const WithTextContent: Story = {
	name: 'with text content',
	render: (args) => (
		<Header {...args}>
			<HeaderContent>Need Help?</HeaderContent>
		</Header>
	),
};

export const WithLongTextContent: Story = {
	name: 'with long text content',
	render: (args) => (
		<Header {...args}>
			<HeaderContent>{'Need Help? '.repeat(100)}</HeaderContent>
		</Header>
	),
};

export const WithTitleAndSubtitle: Story = {
	name: 'with title and subtitle',
	render: (args) => (
		<Header {...args}>
			<HeaderContent>
				<HeaderTitle>Rocket.Chat</HeaderTitle>
				<HeaderSubTitle>Livechat</HeaderSubTitle>
			</HeaderContent>
		</Header>
	),
};

export const WithPicture: Story = {
	name: 'with picture',
	render: (args) => (
		<Header {...args}>
			<HeaderPicture>
				<Bell width={20} height={20} />
			</HeaderPicture>
			<HeaderContent>Notification settings</HeaderContent>
		</Header>
	),
};

export const WithActions: Story = {
	name: 'with actions',
	render: (args) => (
		<Header {...args}>
			<HeaderContent>Chat finished</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};

export const WithMultiplesAlerts: Story = {
	name: 'with multiples alerts',
	render: (args) => (
		<Header
			{...args}
			post={
				<HeaderPost>
					<Alert success>Success</Alert>
					<Alert warning>Warning</Alert>
					<Alert error>Error</Alert>
					<Alert error color='#175CC4'>
						Custom color
					</Alert>
				</HeaderPost>
			}
		>
			<HeaderContent>Chat finished</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};

export const ForUserChat: Story = {
	name: 'for user chat',
	render: (args) => (
		<Header {...args}>
			<HeaderPicture>
				<Avatar src={gazzoAvatar} status='busy' />
			</HeaderPicture>
			<HeaderContent>
				<HeaderTitle>@guilherme.gazzo</HeaderTitle>
				<HeaderSubTitle>guilherme.gazzo@rocket.chat</HeaderSubTitle>
			</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('fullscreen')}>
					<NewWindow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};

export const WithCustomField: Story = {
	name: 'with custom field',
	args: {
		large: true,
	},
	render: (args) => (
		<Header {...args} large>
			<HeaderPicture>
				<Avatar src={gazzoAvatar} large status='away' />
			</HeaderPicture>
			<HeaderContent>
				<HeaderTitle>Guilherme Gazzo</HeaderTitle>
				<HeaderSubTitle>guilherme.gazzo@rocket.chat</HeaderSubTitle>
				<HeaderCustomField>+ 55 42423 24242</HeaderCustomField>
			</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('fullscreen')}>
					<NewWindow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};

export const WithCustomFieldAndAlert: Story = {
	name: 'with custom field and alert',
	args: {
		large: true,
	},
	render: (args) => (
		<Header
			{...args}
			post={
				<HeaderPost>
					<Alert success>Success</Alert>
					<Alert warning>Warning</Alert>
				</HeaderPost>
			}
		>
			<HeaderPicture>
				<Avatar src={gazzoAvatar} large status='online' />
			</HeaderPicture>
			<HeaderContent>
				<HeaderTitle>Guilherme Gazzo</HeaderTitle>
				<HeaderSubTitle>guilherme.gazzo@rocket.chat</HeaderSubTitle>
				<HeaderCustomField>+ 55 42423 24242</HeaderCustomField>
			</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('fullscreen')}>
					<NewWindow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};

export const WithTheme: Story = {
	name: 'with theme',
	args: {
		large: true,
		theme: {
			color: 'darkred',
			fontColor: 'peachpuff',
		},
	},
	render: (args) => (
		<Header {...args}>
			<HeaderPicture>
				<Avatar src={gazzoAvatar} large status='away' />
			</HeaderPicture>
			<HeaderContent>
				<HeaderTitle>Guilherme Gazzo</HeaderTitle>
				<HeaderSubTitle>guilherme.gazzo@rocket.chat</HeaderSubTitle>
				<HeaderCustomField>+ 55 42423 24242</HeaderCustomField>
			</HeaderContent>
			<HeaderActions>
				<HeaderAction onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</HeaderAction>
				<HeaderAction onClick={action('fullscreen')}>
					<NewWindow width={20} height={20} />
				</HeaderAction>
			</HeaderActions>
		</Header>
	),
};
