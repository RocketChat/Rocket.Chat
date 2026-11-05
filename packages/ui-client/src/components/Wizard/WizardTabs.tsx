import { Tabs, TabsItem } from '@rocket.chat/fuselage';

import { useWizardContext } from './useWizardContext.js';
import { useWizardSteps } from './useWizardSteps.js';

export type WizardTabsProps = {
	ordered?: boolean;
};

const WizardTabs = ({ ordered }: WizardTabsProps) => {
	const { steps, currentStep, goTo } = useWizardContext();
	const items = useWizardSteps(steps);

	return (
		<Tabs stretch>
			{items.map((step, index) => (
				<TabsItem key={index} selected={currentStep?.id === step.id} disabled={step.disabled} onClick={() => goTo(step)}>
					{ordered ? `${index + 1}. ${step.title}` : step.title}
				</TabsItem>
			))}
		</Tabs>
	);
};

export default WizardTabs;
