import type { AriaAttributes, DOMAttributes, ReactNode } from 'react';

import type { ActionAccessibilityAttributes, LongPressEvents, PressEvents } from '../../types/Attributes.contract';
import type { WebPressAlias } from '../../types/WebAttributes';

export type PressTargetProps<TElement extends Element> = {
	/** The part's own props: the press handlers and, on React Native, the role and ARIA states the press target takes. */
	press: PressEvents &
		LongPressEvents &
		WebPressAlias<TElement> &
		Pick<DOMAttributes<TElement>, 'onPointerDown' | 'onPointerUp'> &
		ActionAccessibilityAttributes &
		Pick<AriaAttributes, 'aria-checked'> & { disabled?: boolean };
	children: ReactNode;
};

/** Makes the frame it wraps pressable on React Native. On the web the render element already carries the press, so it renders nothing of its own. */
export const PressTarget = <TElement extends Element>({ children }: PressTargetProps<TElement>) => <>{children}</>;
