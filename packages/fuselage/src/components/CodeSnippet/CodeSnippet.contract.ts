import type { AriaAttributes } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type CodeSnippetContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby'> &
	PressEvents & {
		/** The code to show. Empty renders a placeholder. */
		children: string;
		buttonText?: string;
		buttonDisabled?: boolean;
	};
