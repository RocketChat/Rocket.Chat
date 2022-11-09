import { withKnobs, boolean } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { MessageBubble } from '.';
import { loremIpsum, centered } from '../../../helpers.stories';

const text = loremIpsum({ count: 1, units: 'sentences' });

storiesOf('Messages/MessageBubble', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<MessageBubble inverse={boolean('inverse', false)} nude={boolean('nude', false)} quoted={boolean('quoted', false)}>
			{text}
		</MessageBubble>
	))
	.add('inverse', () => (
		<MessageBubble inverse={boolean('inverse', true)} nude={boolean('nude', false)} quoted={boolean('quoted', false)}>
			{text}
		</MessageBubble>
	))
	.add('nude', () => (
		<MessageBubble inverse={boolean('inverse', false)} nude={boolean('nude', true)} quoted={boolean('quoted', false)}>
			{text}
		</MessageBubble>
	))
	.add('quoted', () => (
		<MessageBubble inverse={boolean('inverse', false)} nude={boolean('nude', false)} quoted={boolean('quoted', true)}>
			{text}
		</MessageBubble>
	));
