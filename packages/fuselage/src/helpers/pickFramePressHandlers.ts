import type { DOMAttributes } from 'react';

import type { LongPressEvents, PressEvents } from '../types/Attributes.contract';
import type { WebPressAlias } from '../types/WebAttributes';

export type FramePressHandlers = Record<never, never>;

type FramePressProps<TElement extends Element> = PressEvents &
	LongPressEvents &
	WebPressAlias<TElement> &
	Pick<DOMAttributes<TElement>, 'onPointerDown' | 'onPointerUp'>;

/** The press handlers a frame takes on the web: none, because the render element already carries them. */
export const pickFramePressHandlers = <TElement extends Element>(_props: FramePressProps<TElement>): FramePressHandlers => ({});
