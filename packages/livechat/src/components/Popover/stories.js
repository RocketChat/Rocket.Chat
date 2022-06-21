import { withKnobs, object } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { PopoverContainer, PopoverTrigger } from '.';
import { centered } from '../../helpers.stories';
import { Button } from '../Button';


const centeredWithPopoverContainer = (storyFn, ...args) => (
	<div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
		<PopoverContainer>
			{centered(storyFn, ...args)}
		</PopoverContainer>
	</div>
);

storiesOf('Components/Popover', module)
	.addDecorator(withKnobs)
	.addDecorator(centeredWithPopoverContainer)
	.add('arbitrary renderer', () => (
		<PopoverTrigger>
			{({ pop }) => (
				<Button onClick={pop}>More options...</Button>
			)}
			{({ dismiss, triggerBounds = {} }) => (
				<Button
					style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }}
					outline
					onClick={dismiss}
				>Close me</Button>
			)}
		</PopoverTrigger>
	))
	.add('with overlay props', () => (
		<PopoverTrigger overlayProps={object('overlayProps', { style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } })}>
			{({ pop }) => (
				<Button onClick={pop}>More options...</Button>
			)}
			{({ dismiss, triggerBounds = {} }) => (
				<Button
					style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }}
					outline
					onClick={dismiss}
				>Close me</Button>
			)}
		</PopoverTrigger>
	));
