import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { CSSProperties, ReactNode, Ref } from 'react';

import { useItemListNavigation } from '../hooks/useItemListNavigation';

export type NavigableListProps = {
	'ref'?: Ref<HTMLDivElement>;
	'aria-label': string;
	'style'?: CSSProperties;
	'data-testid'?: string;
	'children'?: ReactNode;
};

/**
 * A `role='list'` container whose rows the arrow keys move between, such as the `List` of a virtualized list.
 */
const NavigableList = ({ ref, ...props }: NavigableListProps) => {
	const navigationRef = useItemListNavigation();
	const mergedRef = useMergedRefs(ref, navigationRef);

	return <div role='list' ref={mergedRef} {...props} />;
};

export default NavigableList;
