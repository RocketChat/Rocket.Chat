import { createContext } from 'react';

import type { StepMetadata } from './lib/StepNode.js';
import type StepNode from './lib/StepNode.js';
import type StepsLinkedList from './lib/StepsLinkedList.js';

export type WizardAPI = {
	steps: StepsLinkedList;
	register(metadata: StepMetadata): () => void;
	currentStep: StepNode | null;
	next(): void;
	previous(): void;
	goTo(step: StepNode): void;
	resetNextSteps(): void;
};

export const WizardContext = createContext<WizardAPI | null>(null);
