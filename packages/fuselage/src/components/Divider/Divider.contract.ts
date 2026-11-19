import type { AriaAttributes, ReactNode } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type DividerContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'aria-orientation'> & {
		/** Colors the rule. Ignored when the divider has `children`. */
		variation?: 'danger' | 'light' | 'medium';
		/** Labels the divider, which then renders as a horizontal separator; `vertical`, `variation`, `flush`, `small` and `stretch` do not apply. */
		children?: ReactNode;
		vertical?: boolean;
		/** Removes the divider's own margin, leaving the spacing to its container. */
		flush?: boolean;
		/** Uses a 4px inline margin on a vertical divider instead of 8px. */
		small?: boolean;
		/** Makes a vertical divider as tall as its container instead of 20px. */
		stretch?: boolean;
	};
