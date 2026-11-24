import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TaskCard } from './TaskCardBlock.js';

/** The steps of a multi-step task, such as an AI agent's, shown together under a title. */
export type PlanBlock = LayoutBlockish<{
	type: 'plan';
	title: string;
	tasks: readonly TaskCard[];
}>;
