import { Tabs, TabsItem } from '@rocket.chat/fuselage';

import { useWizardContext } from './useWizardContext';
import { useWizardSteps } from './useWizardSteps';

type WizardTabsProps = {
	ordered?: boolean;
};

const WizardTabs = ({ ordered }: WizardTabsProps) => {
	const { steps, currentStep, goTo } = useWizardContext();
	const items = useWizardSteps(steps);

	return (
		<Tabs display='flex' flexDirection='column'>
			{items.map((step, index) => (
				<TabsItem
					key={index}
					textAlign='center'
					flexGrow={1}
					selected={currentStep?.id === step.id}
					disabled={step.disabled}
					onClick={() => goTo(step)}
				>
					{ordered ? `${index + 1}. ${step.title}` : step.title}
				</TabsItem>
			))}
		</Tabs>
	);
};

export default WizardTabs;
