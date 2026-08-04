import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { PopoverContainer } from '.';
import { Button } from '../Button';
import PopoverTrigger from './PopoverTrigger';

export default {
	component: PopoverTrigger,
	decorators: [
		(storyFn) => (
			<PopoverContainer>
				<div style={{ display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>{storyFn()}</div>
			</PopoverContainer>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof PopoverTrigger>>;

type Story = StoryObj<ComponentProps<typeof PopoverTrigger>>;

export const ArbitraryRenderer: Story = {
	name: 'arbitrary renderer',
	render: () => (
		<PopoverTrigger>
			{({ pop }) => <Button onClick={pop}>More options...</Button>}
			{({ dismiss, triggerBounds = {} }) => (
				<Button style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }} outline onClick={dismiss}>
					Close me
				</Button>
			)}
		</PopoverTrigger>
	),
};

export const WithOverlayProps: Story = {
	name: 'with overlay props',
	render: () => (
		<PopoverTrigger overlayProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}>
			{({ pop }) => <Button onClick={pop}>More options...</Button>}
			{({ dismiss, triggerBounds = {} }) => (
				<Button style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }} outline onClick={dismiss}>
					Close me
				</Button>
			)}
		</PopoverTrigger>
	),
};
