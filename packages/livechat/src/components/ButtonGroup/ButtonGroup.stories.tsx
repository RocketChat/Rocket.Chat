import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { ButtonGroup } from '.';
import { Button } from '../Button';

export default {
	component: ButtonGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof ButtonGroup>>;

type Story = StoryObj<ComponentProps<typeof ButtonGroup>>;

export const WithButtonsOfSameSize: Story = {
	name: 'with buttons of same size',
	render: (args) => (
		<ButtonGroup {...args}>
			<Button>Yes</Button>
			<Button outline>Cancel</Button>
			<Button danger>No</Button>
		</ButtonGroup>
	),
};

export const WithButtonsOfDifferentSizes: Story = {
	name: 'with buttons of different sizes',
	render: (args) => (
		<ButtonGroup {...args}>
			<Button small>Yes</Button>
			<Button outline>Cancel</Button>
			<Button small danger>
				No
			</Button>
		</ButtonGroup>
	),
};

export const WithOnlySmallButtons: Story = {
	name: 'with only small buttons',
	render: (args) => (
		<ButtonGroup {...args}>
			<Button small>Yes</Button>
			<Button small outline>
				Cancel
			</Button>
			<Button small danger>
				No
			</Button>
		</ButtonGroup>
	),
};

export const WithStackedButtons: Story = {
	name: 'with stacked buttons',
	render: (args) => (
		<ButtonGroup {...args}>
			<Button small outline>
				Rename
			</Button>
			<Button small outline>
				Share
			</Button>
			<Button stack danger>
				Delete
			</Button>
		</ButtonGroup>
	),
};
