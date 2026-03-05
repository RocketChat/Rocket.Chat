import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

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

export const WithTextContent: StoryFn<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<HeaderContent>Need Help?</HeaderContent>
	</Header>
);
WithTextContent.storyName = 'with text content';

export const WithLongTextContent: StoryFn<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<HeaderContent>{'Need Help? '.repeat(100)}</HeaderContent>
	</Header>
);
WithLongTextContent.storyName = 'with long text content';

export const WithTitleAndSubtitle: StoryFn<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<HeaderContent>
			<HeaderTitle>Rocket.Chat</HeaderTitle>
			<HeaderSubTitle>Livechat</HeaderSubTitle>
		</HeaderContent>
	</Header>
);
WithTitleAndSubtitle.storyName = 'with title and subtitle';

export const WithPicture: StoryFn<ComponentProps<typeof Header>> = (args) => (
	<Header {...args}>
		<HeaderPicture>
			<Bell width={20} height={20} />
		</HeaderPicture>
		<HeaderContent>Notification settings</HeaderContent>
	</Header>
);
WithPicture.storyName = 'with picture';

export const WithActions: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
WithActions.storyName = 'with actions';

export const WithMultiplesAlerts: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
WithMultiplesAlerts.storyName = 'with multiples alerts';

export const ForUserChat: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
ForUserChat.storyName = 'for user chat';

export const WithCustomField: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
WithCustomField.storyName = 'with custom field';
WithCustomField.args = {
	large: true,
};

export const WithCustomFieldAndAlert: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
WithCustomFieldAndAlert.storyName = 'with custom field and alert';
WithCustomFieldAndAlert.args = {
	large: true,
};

export const WithTheme: StoryFn<ComponentProps<typeof Header>> = (args) => (
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
);
WithTheme.storyName = 'with theme';
WithTheme.args = {
	large: true,
	theme: {
		color: 'darkred',
		fontColor: 'peachpuff',
	},
};
