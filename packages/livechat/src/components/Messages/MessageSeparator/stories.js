import { withKnobs, boolean, date } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import MessageSeparator from '.';
import { centered } from '../../../helpers.stories';

const defaultDate = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

storiesOf('Messages/MessageSeparator', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('default', () => <MessageSeparator date={null} unread={boolean('unread', false)} />)
	.add('date', () => <MessageSeparator date={new Date(date('date', defaultDate)).toISOString()} unread={boolean('unread', false)} />)
	.add('unread', () => <MessageSeparator date={null} unread={boolean('unread', true)} />);
