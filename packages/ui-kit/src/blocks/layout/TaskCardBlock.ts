import type { LayoutBlockish } from '../LayoutBlockish';
import type { RichTextBlock } from './RichTextBlock';
import type { UrlSourceElement } from '../elements/UrlSourceElement';

export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'error';

/** What a task shows, whether it stands alone as a `task_card` or sits in a `plan`. */
export type TaskCard = {
	/** Tells the tasks of a plan apart, so an app can update one of them. */
	task_id: string;
	title: string;
	status: TaskStatus;
	/** What the task sets out to do. */
	details?: RichTextBlock;
	/** What the task produced. */
	output?: RichTextBlock;
	sources?: readonly UrlSourceElement[];
	/** Shows `details` as the first line instead of the title. */
	hide_title?: boolean;
};

/** One step of a multi-step task, such as an AI agent's, with its status. */
export type TaskCardBlock = LayoutBlockish<{ type: 'task_card' } & TaskCard>;
