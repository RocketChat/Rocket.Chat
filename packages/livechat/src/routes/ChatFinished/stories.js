import { action } from '@storybook/addon-actions';
import { withKnobs, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { screenCentered, screenProps, loremIpsum } from '../../helpers.stories';
import ChatFinished from './component';

const customGreeting = loremIpsum({ count: 3, units: 'words' });
const customText = loremIpsum({ count: 2, units: 'sentences' });

storiesOf('Routes/ChatFinished', module)
	.addDecorator(screenCentered)
	.addDecorator(withKnobs)
	.add('normal', () => (
		<ChatFinished
			title={text('title', 'Chat Finished')}
			greeting={text('greeting', '')}
			message={text('message', '')}
			onRedirectChat={action('redirectChat')}
			{...screenProps()}
		/>
	))
	.add('with custom messages', () => (
		<ChatFinished
			title={text('title', 'Chat Finished')}
			greeting={text('greeting', customGreeting)}
			message={text('message', customText)}
			onRedirectChat={action('redirectChat')}
			{...screenProps()}
		/>
	));
