import type { LayoutBlockish } from '../LayoutBlockish';
import type { IconButtonElement } from '../elements/IconButtonElement';

/** A compact row of actions about the message it closes, such as copying or reporting it. */
export type ContextActionsBlock = LayoutBlockish<{
	type: 'context_actions';
	elements: readonly IconButtonElement[];
}>;
