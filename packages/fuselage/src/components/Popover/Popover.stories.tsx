import type { Meta, StoryObj } from '@storybook/react-vite';
import { cloneElement, isValidElement, useRef } from 'react';
import { useOverlayTrigger } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';

import { Button } from '../Button';
import { Tile } from '../Tile';
import Popover from './Popover';

export default {
	title: 'Layout/Popover',
	component: Popover,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		state: {
			control: false,
			description: 'Overlay trigger state (from `useOverlayTriggerState`) controlling whether the popover is open and how it closes.',
			table: { category: 'State' },
		},
		triggerRef: {
			control: false,
			description: 'Ref to the element the popover is positioned relative to.',
			table: { category: 'Positioning' },
		},
		popoverRef: {
			control: false,
			description: 'Ref to the popover element itself; defaults to an internal ref.',
			table: { category: 'Positioning' },
		},
		portalContainer: {
			control: false,
			description: 'Element the popover portal renders into; defaults to the owner document body.',
			table: { category: 'Positioning' },
		},
		placement: {
			control: 'select',
			options: [
				'bottom',
				'bottom left',
				'bottom right',
				'bottom start',
				'bottom end',
				'top',
				'top left',
				'top right',
				'top start',
				'top end',
				'left',
				'left top',
				'left bottom',
				'start',
				'start top',
				'start bottom',
				'right',
				'right top',
				'right bottom',
				'end',
				'end top',
				'end bottom',
			],
			description: 'Placement of the popover relative to the trigger element.',
			table: { category: 'Positioning', defaultValue: { summary: 'bottom' } },
		},
		offset: {
			control: 'number',
			description: 'Additional offset, in pixels, along the main axis between the popover and the trigger.',
			table: { category: 'Positioning' },
		},
		crossOffset: {
			control: 'number',
			description: 'Additional offset, in pixels, along the cross axis between the popover and the trigger.',
			table: { category: 'Positioning' },
		},
		containerPadding: {
			control: 'number',
			description: 'Minimum padding kept between the popover and the edges of its container.',
			table: { category: 'Positioning', defaultValue: { summary: '12' } },
		},
		shouldFlip: {
			control: 'boolean',
			description: 'Whether the popover flips its placement when there is insufficient room to render fully.',
			table: { category: 'Positioning', defaultValue: { summary: 'true' } },
		},
		isNonModal: {
			control: 'boolean',
			description: 'Renders the popover as non-modal, allowing assistive technologies to interact with elements outside it.',
			table: { category: 'Behavior' },
		},
		isKeyboardDismissDisabled: {
			control: 'boolean',
			description: 'Disables closing the popover with the Escape key.',
			table: { category: 'Behavior' },
		},
		shouldCloseOnInteractOutside: {
			control: false,
			description: 'Filters whether an interaction outside the popover should close it.',
			table: { category: 'Behavior' },
		},
		children: {
			control: false,
			description: 'Content rendered inside the popover.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Popover>;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
	args: {
		children: <Tile>Popover Content</Tile>,
	},
	render: (args) => {
		const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
		const state = useOverlayTriggerState({});
		const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, ref);
		delete triggerProps.onPress;

		return (
			<>
				<Button {...triggerProps} onClick={() => state.toggle()} ref={ref}>
					Open Popover
				</Button>
				{state.isOpen && (
					<Popover {...args} triggerRef={ref} state={state}>
						{args.children && isValidElement(args.children) && cloneElement(args.children, overlayProps)}
					</Popover>
				)}
			</>
		);
	},
};
