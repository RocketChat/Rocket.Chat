import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { ButtonGroup } from '.';
import { Button } from '../Button';

/** @type {import('@storybook/react').ComponentMeta<typeof ButtonGroup>} */
export default {
	title: 'Components/ButtonGroup',
	component: ButtonGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof ButtonGroup>;

export const WithButtonsOfSameSize: ComponentStory<typeof ButtonGroup> = (args) => (
	<ButtonGroup {...args}>
		<Button>Yes</Button>
		<Button outline>Cancel</Button>
		<Button danger>No</Button>
	</ButtonGroup>
);
WithButtonsOfSameSize.storyName = 'with buttons of same size';

export const WithButtonsOfDifferentSizes: ComponentStory<typeof ButtonGroup> = (args) => (
	<ButtonGroup {...args}>
		<Button small>Yes</Button>
		<Button outline>Cancel</Button>
		<Button small danger>
			No
		</Button>
	</ButtonGroup>
);
WithButtonsOfDifferentSizes.storyName = 'with buttons of different sizes';

export const WithOnlySmallButtons: ComponentStory<typeof ButtonGroup> = (args) => (
	<ButtonGroup {...args}>
		<Button small>Yes</Button>
		<Button small outline>
			Cancel
		</Button>
		<Button small danger>
			No
		</Button>
	</ButtonGroup>
);
WithOnlySmallButtons.storyName = 'with only small buttons';

export const WithStackedButtons: ComponentStory<typeof ButtonGroup> = (args) => (
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
);
WithStackedButtons.storyName = 'with stacked buttons';
