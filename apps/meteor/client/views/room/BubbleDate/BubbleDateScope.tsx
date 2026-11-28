import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { BubbleDateStore } from './bubbleDateStore';
import { useHiddenDayDivider } from './bubbleDateStore';

type BubbleDateScopeProps = {
	store: BubbleDateStore;
	className?: string;
	children: ReactNode;
};

/** Hides, within its children, the day divider the floating date stands in for. */
export const BubbleDateScope = ({ store, className, children }: BubbleDateScopeProps) => {
	const hiddenDayDivider = useHiddenDayDivider(store);

	const hiddenDividerClassName = useMemo(
		() =>
			hiddenDayDivider
				? css`
						position: relative;
						& [data-time='${hiddenDayDivider}'] {
							opacity: 0;
						}
					`
				: undefined,
		[hiddenDayDivider],
	);

	return <Box className={[className, hiddenDividerClassName]}>{children}</Box>;
};
