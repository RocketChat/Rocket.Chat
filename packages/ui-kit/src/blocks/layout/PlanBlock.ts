import type { LayoutBlockish } from '../LayoutBlockish';
import type { TaskCard } from './TaskCardBlock';

/** The steps of a multi-step task, such as an AI agent's, shown together under a title. */
export type PlanBlock = LayoutBlockish<{
	type: 'plan';
	title: string;
	tasks: readonly TaskCard[];
}>;
