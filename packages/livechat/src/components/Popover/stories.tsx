import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { PopoverContainer, PopoverTrigger } from '.';
import { Button } from '../Button';

export default {
	title: 'Components/Popover',
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
} satisfies ComponentMeta<typeof PopoverTrigger>;

export const ArbitraryRenderer: ComponentStory<typeof PopoverTrigger> = () => (
	<PopoverTrigger>
		{({ pop }) => <Button onClick={pop}>More options...</Button>}
		{({ dismiss, triggerBounds = {} }) => (
			<Button style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }} outline onClick={dismiss}>
				Close me
			</Button>
		)}
	</PopoverTrigger>
);
ArbitraryRenderer.storyName = 'arbitrary renderer';

export const WithOverlayProps: ComponentStory<typeof PopoverTrigger> = () => (
	<PopoverTrigger overlayProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}>
		{({ pop }) => <Button onClick={pop}>More options...</Button>}
		{({ dismiss, triggerBounds = {} }) => (
			<Button style={{ position: 'absolute', left: triggerBounds.right, top: triggerBounds.bottom }} outline onClick={dismiss}>
				Close me
			</Button>
		)}
	</PopoverTrigger>
);
WithOverlayProps.storyName = 'with overlay props';
