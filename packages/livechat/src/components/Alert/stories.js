import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, color, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import Alert from '.';
import { screenCentered, loremIpsum } from '../../helpers.stories';

storiesOf('Components/Alert', module)
	.addDecorator(withKnobs)
	.addDecorator(screenCentered)
	.add('default', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', false)}
			error={boolean('error', false)}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	))
	.add('success', () => (
		<Alert
			success={boolean('success', true)}
			warning={boolean('warning', false)}
			error={boolean('error', false)}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	))
	.add('warning', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', true)}
			error={boolean('error', false)}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	))
	.add('error', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', false)}
			error={boolean('error', true)}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	))
	.add('custom color', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', false)}
			error={boolean('error', false)}
			color={color('color', '#175CC4')}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	))
	.add('with long text content', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', false)}
			error={boolean('error', false)}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 30, units: 'words' }))}
		</Alert>
	))
	.add('without timeout', () => (
		<Alert
			success={boolean('success', false)}
			warning={boolean('warning', false)}
			error={boolean('error', false)}
			timeout={0}
			onDismiss={action('dismiss')}
		>
			{text('text', loremIpsum({ count: 3, units: 'words' }))}
		</Alert>
	));
