import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, color, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import Header, { Picture, Content, SubTitle, Title, Actions, Action, Post, CustomField } from '.';
import { avatarResolver } from '../../helpers.stories';
import Arrow from '../../icons/arrowDown.svg';
import Bell from '../../icons/bell.svg';
import NewWindow from '../../icons/newWindow.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';


const avatarSrc = avatarResolver('guilherme.gazzo');

storiesOf('Components/Header', module)
	.addDecorator(withKnobs)
	.add('with text content', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			onClick={action('clicked')}
		>
			<Content>
				{text('text', 'Need Help?')}
			</Content>
		</Header>
	))
	.add('with long text content', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			onClick={action('clicked')}
		>
			<Content>
				{text('text', 'Need Help? '.repeat(100))}
			</Content>
		</Header>
	))
	.add('with title and subtitle', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			onClick={action('clicked')}
		>
			<Content>
				<Title>{text('title', 'Rocket.Chat')}</Title>
				<SubTitle>{text('subtitle', 'Livechat')}</SubTitle>
			</Content>
		</Header>
	))
	.add('with picture', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			onClick={action('clicked')}
		>
			<Picture>
				<Bell width={20} height={20} />
			</Picture>

			<Content>
				{text('text', 'Notification settings')}
			</Content>
		</Header>
	))
	.add('with actions', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			onClick={action('clicked')}
		>
			<Content>
				{text('text', 'Chat finished')}
			</Content>

			<Actions>
				<Action onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</Action>
				<Action onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</Action>
			</Actions>
		</Header>
	))
	.add('with multiple alerts', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			post={
				<Post>
					<Alert
						success={boolean('success', true)}
						onDismiss={action('clicked')}
					>
						{text('text', 'Success')}
					</Alert>
					<Alert
						warning={boolean('warning', true)}
						onDismiss={action('clicked')}
					>
						{text('text', 'Warning')}
					</Alert>
					<Alert
						error={boolean('error', true)}
						onDismiss={action('clicked')}
					>
						{text('text', 'Error')}
					</Alert>
					<Alert
						error={boolean('error', true)}
						color={color('color', '#175CC4')}
						onDismiss={action('clicked')}
					>
						{text('text', 'Custom color')}
					</Alert>
				</Post>
			}
		>
			<Content>
				{text('text', 'Chat finished')}
			</Content>

			<Actions>
				<Action onClick={action('notifications')}>
					<Bell width={20} height={20} />
				</Action>
				<Action onClick={action('minimize')}>
					<Arrow width={20} height={20} />
				</Action>
			</Actions>
		</Header>
	))
	.add('for user chat', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
		>
			<Picture>
				<Avatar src={avatarSrc} status={'busy'} />
			</Picture>

			<Content>
				<Title>{text('title', '@guilherme.gazzo')}</Title>
				<SubTitle>
					{text('subtitle', 'guilherme.gazzo@rocket.chat')}
				</SubTitle>
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
	))
	.add('with custom field', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			large
		>
			<Picture>
				<Avatar src={avatarSrc} large status={'away'} />
			</Picture>

			<Content>
				<Title>{text('title', 'Guilherme Gazzo')}</Title>
				<SubTitle>
					{text('subtitle', 'guilherme.gazzo@rocket.chat')}
				</SubTitle>
				<CustomField>
					{text('custom', '+ 55 42423 24242')}
				</CustomField>
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
	))
	.add('with custom field and alert', () => (
		<Header
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
			}}
			post={
				<Post>
					<Alert
						success={boolean('success', true)}
						onDismiss={action('clicked')}
					>
						{text('text', 'Success')}
					</Alert>
					<Alert
						warning={boolean('warning', true)}
						onDismiss={action('clicked')}
					>
						{text('text', 'Warning')}
					</Alert>
				</Post>
			}
			large
		>
			<Picture>
				<Avatar src={avatarSrc} large status={'online'} />
			</Picture>

			<Content>
				<Title>{text('title', 'Guilherme Gazzo')}</Title>
				<SubTitle>
					{text('subtitle', 'guilherme.gazzo@rocket.chat')}
				</SubTitle>
				<CustomField>
					{text('custom', '+ 55 42423 24242')}
				</CustomField>
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
	))
	.add('with theme', () => (
		<Header
			theme={{
				color: color('theme/color', 'darkred'),
				fontColor: color('theme/fontColor', 'peachpuff'),
			}}
			large
		>
			<Picture>
				<Avatar src={avatarSrc} large status={'away'} />
			</Picture>

			<Content>
				<Title>{text('title', 'Guilherme Gazzo')}</Title>
				<SubTitle>
					{text('subtitle', 'guilherme.gazzo@rocket.chat')}
				</SubTitle>
				<CustomField>
					{text('custom', '+ 55 42423 24242')}
				</CustomField>
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
	));
