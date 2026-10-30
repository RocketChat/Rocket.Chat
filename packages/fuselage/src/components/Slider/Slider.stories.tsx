import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { screen, userEvent } from 'storybook/test';

import { Box } from '../Box';
import Slider from './Slider';

export default {
	title: 'Inputs/Slider',
	component: Slider,
	argTypes: {
		label: {
			control: 'text',
			description: 'Text label associated with the slider.',
		},
		formatOptions: {
			control: false,
			description: 'Intl.NumberFormat options used to format the output value.',
		},
		id: {
			control: 'text',
			description: 'Id of the slider input element, used to connect with an external label.',
		},
		showOutput: {
			control: 'boolean',
			description: 'Shows the current value next to the label.',
			table: { defaultValue: { summary: 'true' } },
		},
		multiThumb: {
			control: 'boolean',
			description: 'Renders two thumbs to select a range of values.',
			table: { defaultValue: { summary: 'false' } },
		},
		step: {
			control: 'number',
			description: 'Increment step between selectable values.',
		},
		minValue: {
			control: 'number',
			description: 'Minimum selectable value.',
			table: { defaultValue: { summary: '0' } },
		},
		maxValue: {
			control: 'number',
			description: 'Maximum selectable value.',
			table: { defaultValue: { summary: '100' } },
		},
		orientation: {
			control: 'select',
			options: ['horizontal', 'vertical'],
			description: 'Layout direction of the slider.',
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the slider and blocks pointer interaction.',
		},
		defaultValue: {
			control: false,
			description: 'Initial, uncontrolled value (or [min, max] for multiThumb).',
		},
		value: {
			control: false,
			description: 'Controlled current value (or [min, max] for multiThumb).',
		},
		onChange: {
			control: false,
			description: 'Called when the value changes.',
		},
	},
} satisfies Meta<typeof Slider>;

type Story = StoryObj<typeof Slider>;

const render: Story['render'] = (args) => (
	<Box width='x300' display='flex' alignItems='center'>
		<Slider {...args} />
	</Box>
);
const renderVertical: Story['render'] = (args) => (
	<Box height='x200' display='flex' alignItems='center'>
		<Slider {...args} />
	</Box>
);

export const SliderPlayExample: Story = {
	render,
	args: {
		'aria-label': 'aria-range-label',
		'maxValue': 50,
	},
	play: async () => {
		const slider = screen.getByRole<HTMLFormElement>('slider');
		void userEvent.tab();
		await userEvent.type(slider, '{arrowright}'.repeat(50), {
			skipClick: true,
			delay: 1000,
		});
	},
};

export const Disabled: Story = {
	render,
	args: {
		disabled: true,
	},
};

export const Default: Story = {
	render,
	args: {
		'aria-label': 'aria-range-label',
		'maxValue': 500,
	},
};

export const NoOutput: Story = {
	render,
	args: {
		'showOutput': false,
		'aria-label': 'range',
	},
};

export const WithLabel: Story = {
	render,
	args: {
		'label': 'Range',
		'aria-label': 'range',
	},
};

export const Vertical: Story = {
	render: renderVertical,
	args: {
		'label': 'Range',
		'aria-label': 'range',
		'orientation': 'vertical',
	},
};

export const VerticalMultiThumb: Story = {
	render: renderVertical,
	args: {
		'label': 'Range',
		'aria-label': 'range',
		'orientation': 'vertical',
		'multiThumb': true,
	},
};

export const WithDefaultValue: Story = {
	render,
	args: {
		'defaultValue': 25,
		'aria-label': 'range',
	},
};

export const MultiThumb: Story = {
	render,
	args: {
		'aria-label': 'range',
		'multiThumb': true,
		'maxValue': 500,
		'step': 10,
	},
};

export const ControlledValue: Story = {
	render: () => {
		const [value, setValue] = useState<number>(20);
		return (
			<Box width='500px' height='80px' display='flex' alignItems='center'>
				<Slider label='Range' value={value} onChange={setValue} />
			</Box>
		);
	},
};

export const NumberFormatOptions: Story = {
	render: () => (
		<Box width='500px' height='80px' display='flex' alignItems='center'>
			<Slider
				multiThumb
				label='Price range'
				defaultValue={[100, 350]}
				maxValue={500}
				step={10}
				formatOptions={{ style: 'currency', currency: 'USD' }}
			/>
		</Box>
	),
};
