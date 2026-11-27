import type { AriaAttributes, Dispatch, SetStateAction } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type ItemsPerPage = 25 | 50 | 100;

type LabelContext = { count: number; current: number; itemsPerPage: ItemsPerPage };

export type PaginationContract = CommonAttributes &
	PressEvents &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		/** Total number of items being paginated. */
		count: number;
		/** Zero-based index of the first item shown. */
		current?: number;
		divider?: boolean;
		itemsPerPage?: ItemsPerPage;
		itemsPerPageLabel?: (context: LabelContext) => string;
		showingResultsLabel?: (context: LabelContext) => string;
		onSetCurrent?: Dispatch<SetStateAction<number>>;
		onSetItemsPerPage?: Dispatch<SetStateAction<ItemsPerPage>>;
	};
