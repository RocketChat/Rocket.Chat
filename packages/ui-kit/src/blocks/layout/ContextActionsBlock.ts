import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { FeedbackButtonsElement } from '../elements/FeedbackButtonsElement.js';
import type { IconButtonElement } from '../elements/IconButtonElement.js';

/** A compact row of actions about the message it closes, such as copying or reporting it. */
export type ContextActionsBlock = LayoutBlockish<{
	type: 'context_actions';
	elements: readonly (FeedbackButtonsElement | IconButtonElement)[];
}>;
