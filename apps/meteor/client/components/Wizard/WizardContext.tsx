import { createContext } from 'react';

import type { StepMetadata, StepNode, StepsLinkedList } from './lib/StepsLinkedList';

export type WizardAPI = {
	steps: StepsLinkedList;
	register(metadata: StepMetadata): void;
	currentStep: StepNode | null;
	next(): void;
	previous(): void;
	goTo(step: StepNode): void;
	resetNextSteps(): void;
};

export const WizardContext = createContext<WizardAPI | null>(null);
