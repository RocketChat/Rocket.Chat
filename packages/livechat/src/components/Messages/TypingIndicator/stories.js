import { withKnobs, object, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { TypingIndicator } from '.';
import { avatarResolver, centered } from '../../../helpers.stories';


storiesOf('Messages/TypingIndicator', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<TypingIndicator
			avatarResolver={avatarResolver}
			usernames={object('usernames', [])}
			text={text('text', 'The attendant is typing')}
		/>
	))
	.add('with avatars', () => (
		<TypingIndicator
			avatarResolver={avatarResolver}
			usernames={object('usernames', ['guilherme.gazzo', 'tasso.evangelista', 'martin.schoeler'])}
			text={text('text', 'The attendant is typing')}
		/>
	));
