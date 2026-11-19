import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import Wizard from './Wizard.js';
import WizardActions from './WizardActions.js';
import WizardBackButton from './WizardBackButton.js';
import WizardNextButton from './WizardNextButton.js';
import { useWizard } from './useWizard.js';

export default {
	component: WizardActions,
	decorators: (Story) => {
		const wizardApi = useWizard({
			steps: [
				{ id: 'first-step', title: 'First step' },
				{ id: 'second-step', title: 'Second step' },
				{ id: 'third-step', title: 'Third step' },
			],
		});

		return (
			<Box width={600}>
				<Wizard api={wizardApi}>
					<Story />
				</Wizard>
			</Box>
		);
	},
	parameters: {
		layout: 'centered',
	},
	render: (args) => (
		<WizardActions {...args}>
			<WizardBackButton />
			<WizardNextButton />
		</WizardActions>
	),
} satisfies Meta<typeof WizardActions>;

export const Default: StoryObj<typeof WizardActions> = {
	args: {},
};

export const WithAnnotation: StoryObj<typeof WizardActions> = {
	args: {
		annotation: 'This is a sample annotation',
	},
};
