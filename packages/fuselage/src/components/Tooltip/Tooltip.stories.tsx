import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useLayoutEffect, useRef } from 'react';

import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { IconButton } from '../Button';
import { PositionAnimated } from '../PositionAnimated';
import Tooltip from './Tooltip';

export default {
	title: 'Data Display/Tooltip',
	component: Tooltip,
	parameters: {
		docs: {
			description: {
				component:
					'Shows additional, complementary information about an element on hover.\n\n' +
					'**Rules**\n' +
					'- Position 4px from the trigger edge on the opening side; center the tooltip on the trigger.\n' +
					"- Never put vital information only in a tooltip — it's complementary and hover-only (unavailable on touch).\n" +
					'- Good for ambiguous elements (number badges, mentions) and icon buttons.\n' +
					'- Keep copy concise; line breaks are allowed.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Tooltip content.',
		},
		variation: {
			control: 'select',
			options: ['dark', 'light'],
			description: 'Color kind applied to the tooltip.',
			table: { defaultValue: { summary: 'dark' } },
		},
		placement: {
			control: 'select',
			options: [
				'top-start',
				'top-middle',
				'top-end',
				'bottom-start',
				'bottom-middle',
				'bottom-end',
				'top',
				'left',
				'bottom',
				'right',
				null,
			],
			description: 'Direction the tooltip arrow points, relative to its anchor.',
		},
	},
} satisfies Meta<typeof Tooltip>;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
	args: {
		children: 'An example tooltip',
	},
};

export const LightTooltip: Story = {
	args: {
		variation: 'light',
		children: 'An example tooltip',
	},
};

export const WithLineBreak: Story = {
	args: {
		children: (
			<>
				First line of the tooltip
				<br />
				Second line of the tooltip
			</>
		),
	},
	parameters: {
		docs: {
			description: {
				story: 'Line breaks are supported for longer or structured copy.',
			},
		},
	},
};

type AnchoredTooltipProps = {
	placement: UsePositionOptions['placement'];
};

const AnchoredTooltip = ({ placement }: AnchoredTooltipProps) => {
	const anchor = useRef<HTMLButtonElement>(null);

	return (
		<Box display='inline-flex' paddingBlock='x56' paddingInline='x96'>
			<IconButton ref={anchor} icon='home' size='small' aria-label={placement} />
			<PositionAnimated anchor={anchor} placement={placement} margin={8} visible={AnimatedVisibility.VISIBLE}>
				<Tooltip>{placement}</Tooltip>
			</PositionAnimated>
		</Box>
	);
};

const ArrowGrid = () => (
	<>
		<Box>
			<AnchoredTooltip placement='bottom-start' />
			<AnchoredTooltip placement='bottom-middle' />
			<AnchoredTooltip placement='bottom-end' />
		</Box>
		<Box>
			<AnchoredTooltip placement='right-middle' />
			<AnchoredTooltip placement='left-middle' />
		</Box>
		<Box>
			<AnchoredTooltip placement='top-start' />
			<AnchoredTooltip placement='top-middle' />
			<AnchoredTooltip placement='top-end' />
		</Box>
	</>
);

export const ArrowPositioning: Story = {
	render: () => <ArrowGrid />,
};

export const ArrowPositioningRTL: Story = {
	name: 'Arrow Positioning (RTL)',
	render: () => <ArrowGrid />,
	decorators: [
		(Story) => {
			// Set on the document root so the portalled tooltips inherit it too.
			useLayoutEffect(() => {
				document.documentElement.dir = 'rtl';

				return () => {
					document.documentElement.removeAttribute('dir');
				};
			}, []);

			return <Story />;
		},
	],
	parameters: {
		docs: {
			description: {
				story: 'Placements are physical, so every arrow must still point at its button, exactly as in `ArrowPositioning`.',
			},
		},
	},
};
