import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import { h } from 'preact';

import { TypingDots } from '.';
import { centered } from '../../../helpers.stories';


storiesOf('Messages/TypingDots', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => (
		<TypingDots text={text('text', 'The attendant is typing')} />
	));
