import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Header, { Picture, Content, SubTitle, Title, Actions, Action, Post, CustomField } from '.';
import { gazzoAvatar } from '../../../.storybook/helpers';
import Arrow from '../../icons/arrowDown.svg';
import Bell from '../../icons/bell.svg';
import NewWindow from '../../icons/newWindow.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';

export default {
	title: 'Components/Header',
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

export const WithTextContent: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Content>Need Help?</Content>
	</Header>
);
WithTextContent.storyName = 'with text content';

export const WithLongTextContent: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Content>{'Need Help? '.repeat(100)}</Content>
	</Header>
);
WithLongTextContent.storyName = 'with long text content';

export const WithTitleAndSubtitle: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Content>
			<Title>Rocket.Chat</Title>
			<SubTitle>Livechat</SubTitle>
		</Content>
	</Header>
);
WithTitleAndSubtitle.storyName = 'with title and subtitle';

export const WithPicture: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Picture>
			<Bell width={20} height={20} />
		</Picture>
		<Content>Notification settings</Content>
	</Header>
);
WithPicture.storyName = 'with picture';

export const WithActions: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Content>Chat finished</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
WithActions.storyName = 'with actions';

export const WithMultiplesAlerts: Story<ComponentProps<typeof Header>> = (args) => (
	<Header
		{...args}
		post={
			<Post>
				<Alert success>Success</Alert>
				<Alert warning>Warning</Alert>
				<Alert error>Error</Alert>
				<Alert error color='#175CC4'>
					Custom color
				</Alert>
			</Post>
		}
	>
		<Content>Chat finished</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
WithMultiplesAlerts.storyName = 'with multiples alerts';

export const ForUserChat: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Picture>
			<Avatar src={gazzoAvatar} status='busy' />
		</Picture>
		<Content>
			<Title>@guilherme.gazzo</Title>
			<SubTitle>guilherme.gazzo@rocket.chat</SubTitle>
		</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
			<Action onClick={action('fullscreen')}>
				<NewWindow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
ForUserChat.storyName = 'for user chat';

export const WithCustomField: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args} large>
		<Picture>
			<Avatar src={gazzoAvatar} large status='away' />
		</Picture>
		<Content>
			<Title>Guilherme Gazzo</Title>
			<SubTitle>guilherme.gazzo@rocket.chat</SubTitle>
			<CustomField>+ 55 42423 24242</CustomField>
		</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
			<Action onClick={action('fullscreen')}>
				<NewWindow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
WithCustomField.storyName = 'with custom field';
WithCustomField.args = {
	large: true,
};

export const WithCustomFieldAndAlert: Story<ComponentProps<typeof Header>> = (args) => (
	<Header
		{...args}
		post={
			<Post>
				<Alert success>Success</Alert>
				<Alert warning>Warning</Alert>
			</Post>
		}
	>
		<Picture>
			<Avatar src={gazzoAvatar} large status='online' />
		</Picture>
		<Content>
			<Title>Guilherme Gazzo</Title>
			<SubTitle>guilherme.gazzo@rocket.chat</SubTitle>
			<CustomField>+ 55 42423 24242</CustomField>
		</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
			<Action onClick={action('fullscreen')}>
				<NewWindow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
WithCustomFieldAndAlert.storyName = 'with custom field and alert';
WithCustomFieldAndAlert.args = {
	large: true,
};

export const WithTheme: Story<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<Picture>
			<Avatar src={gazzoAvatar} large status='away' />
		</Picture>
		<Content>
			<Title>Guilherme Gazzo</Title>
			<SubTitle>guilherme.gazzo@rocket.chat</SubTitle>
			<CustomField>+ 55 42423 24242</CustomField>
		</Content>
		<Actions>
			<Action onClick={action('notifications')}>
				<Bell width={20} height={20} />
			</Action>
			<Action onClick={action('minimize')}>
				<Arrow width={20} height={20} />
			</Action>
			<Action onClick={action('fullscreen')}>
				<NewWindow width={20} height={20} />
			</Action>
		</Actions>
	</Header>
);
WithTheme.storyName = 'with theme';
WithTheme.args = {
	large: true,
	theme: {
		color: 'darkred',
		fontColor: 'peachpuff',
	},
};
