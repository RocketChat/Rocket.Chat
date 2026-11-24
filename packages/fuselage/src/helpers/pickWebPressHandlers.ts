import type { MouseEvent } from 'react';

import type { PressEvents } from '../types/Attributes.contract';
import type { WebPressAlias } from '../types/WebAttributes';

type WebPressHandlers<TElement extends Element> = {
	onClick?: (event: MouseEvent<TElement>) => void;
};

/** Adapts the platform-neutral `onPress` to a web click handler, keeping the deprecated `onClick` alias working. */
export const pickWebPressHandlers = <TElement extends Element>({
	onPress,
	onClick,
}: PressEvents & WebPressAlias<TElement>): WebPressHandlers<TElement> => {
	if (!onPress && !onClick) {
		return {};
	}

	return {
		onClick: (event) => {
			onClick?.(event);
			onPress?.();
		},
	};
};
