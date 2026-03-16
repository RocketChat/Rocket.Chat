import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import Wizard from './Wizard';
import type { WizardActionsProps } from './WizardActions';
import WizardActions from './WizardActions';
import WizardBackButton from './WizardBackButton';
import WizardNextButton from './WizardNextButton';
import { useWizard } from './useWizard';

export default {
	title: 'Components/Wizard/WizardActions',
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
} satisfies Meta<typeof WizardActions>;

const Template: StoryFn<WizardActionsProps> = (args) => (
	<WizardActions {...args}>
		<WizardBackButton />
		<WizardNextButton />
	</WizardActions>
);

export const Default = Template.bind({});
Default.args = {};

export const WithAnnotation = Template.bind({});
WithAnnotation.args = {
	annotation: 'This is a sample annotation',
};
