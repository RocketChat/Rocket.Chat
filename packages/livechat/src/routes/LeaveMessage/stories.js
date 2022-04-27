import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { screenCentered, screenProps } from '../../helpers.stories';
import LeaveMessage from './component';


storiesOf('Routes/Leave a message', module)
	.addDecorator(screenCentered)
	.addDecorator(withKnobs)
	.add('normal', () => (
		<LeaveMessage
			title={text('title', '')}
			message={text('message', '')}
			unavailableMessage={text('unavailableMessage', '')}
			hasForm={boolean('hasForm', true)}
			loading={boolean('loading', false)}
			onSubmit={action('submit')}
			{...screenProps()}
		/>
	))
	.add('loading', () => (
		<LeaveMessage
			title={text('title', '')}
			message={text('message', '')}
			unavailableMessage={text('unavailableMessage', '')}
			hasForm={boolean('hasForm', true)}
			loading={boolean('loading', true)}
			onSubmit={action('submit')}
			{...screenProps()}
		/>
	))
	.add('unavailable', () => (
		<LeaveMessage
			title={text('title', '')}
			message={text('message', '')}
			unavailableMessage={text('unavailableMessage', '')}
			hasForm={boolean('hasForm', false)}
			loading={boolean('loading', false)}
			onSubmit={action('submit')}
			{...screenProps()}
		/>
	));
