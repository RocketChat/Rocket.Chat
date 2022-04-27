import { action } from '@storybook/addon-actions';
import { withKnobs, color, text, object } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { screenCentered, screenProps } from '../../helpers.stories';
import TriggerMessage from './component';

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

const messages = [
	{ _id: 1, u: { _id: 1, username: 'guilherme.gazzo' }, msg: 'Hi There!' },
	{ _id: 2, u: { _id: 2, username: 'guilherme.gazzo' }, msg: 'Rocket.Chat allows you to chat and create better relationship with your customers on their favorite channels. ' },
	{ _id: 3, u: { _id: 3, username: 'guilherme.gazzo' }, msg: 'Let us know if you have any question.' },
].map((message, i) => ({
	...message,
	ts: new Date(now.getTime() - (15 - i) * 60000 - (i < 5 ? 24 * 60 * 60 * 1000 : 0)).toISOString(),
}));

storiesOf('Routes/TriggerMessage', module)
	.addDecorator(screenCentered)
	.addDecorator(withKnobs)
	.add('single', () => (
		<TriggerMessage
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
				iconColor: color('theme/iconColor', ''),
			}}
			messages={object('messages', messages.filter(({ _id }) => _id === 3))}
			title={text('title', '')}
			onSubmit={action('submit')}
			onCancel={action('cancel')}
			{...screenProps()}
		/>
	))
	.add('multiple', () => (
		<TriggerMessage
			theme={{
				color: color('theme/color', ''),
				fontColor: color('theme/fontColor', ''),
				iconColor: color('theme/iconColor', ''),
			}}
			messages={object('messages', messages)}
			title={text('title', '')}
			onSubmit={action('submit')}
			onCancel={action('cancel')}
			{...screenProps()}
		/>
	));
