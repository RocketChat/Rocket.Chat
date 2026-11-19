import type { Meta, StoryObj } from '@storybook/react';
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
			table: { category: 'State' },
		},
		triggerRef: {
			control: false,
			description: 'Ref to the element the popover opens next to.',
			table: { category: 'Positioning' },
		},
		popoverRef: {
			control: false,
			table: { category: 'Positioning' },
		},
		portalContainer: {
			control: false,
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
			description: 'Side of the trigger the popover opens on, then how it aligns along that side.',
			table: { category: 'Positioning', defaultValue: { summary: 'bottom' } },
		},
		offset: {
			control: 'number',
			description: 'Space, in pixels, between the trigger and the popover.',
			table: { category: 'Positioning' },
		},
		crossOffset: {
			control: 'number',
			description: 'Shift, in pixels, of the popover along the side of the trigger it opens on.',
			table: { category: 'Positioning' },
		},
		containerPadding: {
			control: 'number',
			description: 'Space, in pixels, the popover keeps from the edges of the page.',
			table: { category: 'Positioning', defaultValue: { summary: '12' } },
		},
		shouldFlip: {
			control: 'boolean',
			description: 'Moves the popover to the opposite side of the trigger when it does not fit on the requested one.',
			table: { category: 'Positioning', defaultValue: { summary: 'true' } },
		},
		isNonModal: {
			control: 'boolean',
			description:
				'Leaves the rest of the page reachable, including by assistive technology, while the popover is open; a click outside no longer closes it.',
			table: { category: 'Behavior' },
		},
		isKeyboardDismissDisabled: {
			control: 'boolean',
			description: 'Keeps the popover open when the user presses Escape.',
			table: { category: 'Behavior' },
		},
		shouldCloseOnInteractOutside: {
			control: false,
			description: 'Decides, for the element the user interacted with outside the popover, whether that closes it.',
			table: { category: 'Behavior' },
		},
		children: {
			control: false,
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
