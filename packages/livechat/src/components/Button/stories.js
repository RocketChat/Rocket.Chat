import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Button } from '.';
import { avatarResolver, centered } from '../../helpers.stories';
import ChatIcon from '../../icons/chat.svg';

const defaultSrc = avatarResolver('guilherme.gazzo');

const defaultText = 'Powered by Rocket.Chat';
const defaultBadge = 'badged';

storiesOf('Components/Button', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('normal', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('disabled', () => (
		<Button
			disabled={boolean('disabled', true)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('outline', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', true)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('nude', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', true)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('danger', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', true)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('secondary', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', true)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('stack', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', true)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('small', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', true)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('loading', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', true)}
			badge={text('badge', '')}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('with badge', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', defaultBadge)}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('with icon', () => (
		<Button
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			nude={boolean('nude', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', '')}
			icon={<ChatIcon />}
			onClick={action('clicked')}
		>
			{text('text', defaultText)}
		</Button>
	))
	.add('transparent with background image', () => (
		<Button
			img={defaultSrc}
			disabled={boolean('disabled', false)}
			outline={boolean('outline', false)}
			danger={boolean('danger', false)}
			secondary={boolean('secondary', false)}
			stack={boolean('stack', false)}
			small={boolean('small', false)}
			loading={boolean('loading', false)}
			badge={text('badge', 1)}
			icon={<ChatIcon />}
			onClick={action('clicked')}
			transparent={boolean('transparent', true)}
		>
			{text('text', defaultText)}
		</Button>
	));
