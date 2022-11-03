import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, number, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { loremIpsum, centered } from '../../helpers.stories';
import Modal from './component';

const LoremIpsum = ({ padding = '5rem', count = 5, units = 'paragraphs', ...options }) => (
	<div style={{ padding }}>
		{loremIpsum({ count, units, ...options })
			.split('\n')
			.map((paragraph) => (
				<p>{paragraph}</p>
			))}
	</div>
);

storiesOf('Components/Modal', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('normal', () => (
		<div>
			<LoremIpsum />
			<Modal open={boolean('open', true)} animated={boolean('animated', false)} onDismiss={action('dismiss')}>
				{text('content', loremIpsum({ count: 1, units: 'paragraphs' }))}
			</Modal>
		</div>
	))
	.add('animated', () => (
		<div>
			<LoremIpsum />
			<Modal open={boolean('open', true)} animated={boolean('animated', true)} onDismiss={action('dismiss')}>
				{text('content', loremIpsum({ count: 1, units: 'paragraphs' }))}
			</Modal>
		</div>
	))
	.add('timeout', () => (
		<div>
			<LoremIpsum />
			<Modal
				open={boolean('open', true)}
				animated={boolean('animated', false)}
				timeout={number('timeout', 3000)}
				onDismiss={action('dismiss')}
			>
				{text('content', loremIpsum({ count: 1, units: 'paragraphs' }))}
			</Modal>
		</div>
	))
	.add('disallow dismiss by overlay', () => (
		<div>
			<LoremIpsum />
			<Modal open={boolean('open', true)} animated={boolean('animated', false)} dismissByOverlay={false} onDismiss={action('dismiss')}>
				{text('content', loremIpsum({ count: 1, units: 'paragraphs' }))}
			</Modal>
		</div>
	))
	.add('confirm', () => (
		<div>
			<LoremIpsum />
			<Modal.Confirm
				text={text('text', 'Are you ok?')}
				confirmButtonText={text('confirmButtonText', 'Yes')}
				cancelButtonText={text('cancelButtonText', 'No')}
				onConfirm={action('confirm')}
				onCancel={action('cancel')}
			/>
		</div>
	))
	.add('alert', () => (
		<div>
			<LoremIpsum />
			<Modal.Alert text={text('text', 'You look great today.')} buttonText={text('buttonText', 'OK')} onConfirm={action('confirm')} />
		</div>
	));
