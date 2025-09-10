import { Box, Button, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import Wizard from './Wizard';
import WizardActions from './WizardActions';
import WizardBackButton from './WizardBackButton';
import WizardContent from './WizardContent';
import WizardNextButton from './WizardNextButton';
import WizardTabs from './WizardTabs';
import { useWizard } from './useWizard';

export default {
	title: 'Components/Wizard',
	component: Wizard,
	subcomponents: {
		WizardActions,
		WizardBackButton,
		WizardContent,
		WizardNextButton,
		WizardTabs,
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<Box>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof Wizard>;

const WizardExample = ({ ordered = false }: { ordered?: boolean }) => {
	const wizardApi = useWizard({
		steps: [
			{ id: 'first-step', title: 'First step' },
			{ id: 'second-step', title: 'Second step' },
			{ id: 'third-step', title: 'Third step' },
		],
	});

	return (
		<Wizard api={wizardApi}>
			<WizardTabs ordered={ordered} />

			<WizardContent id='first-step'>
				<Box width='100%' height='100%' pbs={24}>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>First step</StatesTitle>
					</States>
				</Box>

				<WizardActions>
					<WizardNextButton />
				</WizardActions>
			</WizardContent>
			<WizardContent id='second-step'>
				<Box width='100%' height='100%' pbs={24}>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>Second step</StatesTitle>
					</States>
				</Box>

				<WizardActions>
					<WizardBackButton />
					<WizardNextButton />
				</WizardActions>
			</WizardContent>
			<WizardContent id='third-step'>
				<Box width='100%' height='100%' pbs={24}>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>Third step</StatesTitle>
					</States>
				</Box>

				<WizardActions>
					<Button primary onClick={() => window.alert('Finished!')}>
						Finish
					</Button>
				</WizardActions>
			</WizardContent>
		</Wizard>
	);
};

export const BasicWizard: StoryFn<typeof Wizard> = () => <WizardExample />;

export const OrderedTabsWizard: StoryFn<typeof Wizard> = () => <WizardExample ordered />;
