import { withKnobs, object } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { MessageAvatars } from '.';
import { avatarResolver, centered } from '../../../helpers.stories';

storiesOf('Messages/MessageAvatars', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('empty', () => <MessageAvatars avatarResolver={avatarResolver} usernames={object('usernames', [])} />)
	.add('with one avatar', () => <MessageAvatars avatarResolver={avatarResolver} usernames={object('usernames', ['guilherme.gazzo'])} />)
	.add('with two avatars', () => (
		<MessageAvatars avatarResolver={avatarResolver} usernames={object('usernames', ['guilherme.gazzo', 'tasso.evangelista'])} />
	))
	.add('with three avatars', () => (
		<MessageAvatars
			avatarResolver={avatarResolver}
			usernames={object('usernames', ['guilherme.gazzo', 'tasso.evangelista', 'martin.schoeler'])}
		/>
	))
	.add('with name as avatar instead of username for guests', () => (
		<MessageAvatars avatarResolver={avatarResolver} usernames={object('usernames', ['livechat guest'])} />
	));
