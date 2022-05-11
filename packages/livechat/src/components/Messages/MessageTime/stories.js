import { withKnobs, date } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import MessageTime from '.';
import { centered } from '../../../helpers.stories';


const today = new Date(Date.parse('2021-01-01T00:00:00.000Z'));
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

storiesOf('Messages/MessageTime', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('today', () => (
		<MessageTime ts={date('ts', today)} />
	))
	.add('yesterday', () => (
		<MessageTime ts={date('ts', yesterday)} />
	));
