import type { ReactNode } from 'react';

import type { ActionContract } from '../../types/Attributes.contract';

export type ChipContract = ActionContract & {
	children?: ReactNode;
	thumbUrl?: string;
	renderThumb?: (props: { url: string }) => ReactNode;
	renderDismissSymbol?: () => ReactNode;
	/** Renders a 20px tall chip. */
	small?: boolean;
	/** Renders the text in uppercase, for chips that categorize rather than select. */
	label?: boolean;
	/** A chip with no press handler is disabled unless this says otherwise. */
	disabled?: boolean;
};
