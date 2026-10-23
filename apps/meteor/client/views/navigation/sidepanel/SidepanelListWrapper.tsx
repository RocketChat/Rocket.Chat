import { SidepanelList } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import type { Components } from 'react-virtuoso';

import type { VirtuosoListContext } from '../../../components/VirtuosoList';
import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import { useSidebarListNavigation } from '../sidebar/RoomList/useSidebarListNavigation';

const SidepanelListWrapper: Components<unknown, VirtuosoListContext>['List'] = forwardRef(function SidepanelListWrapper(
	{ context, ...props },
	ref,
) {
	const sidebarListRef = useSidebarListNavigation();
	const mergedRefs = useMergedRefsV2(ref, sidebarListRef);

	return <SidepanelList aria-label={context?.['aria-label']} ref={mergedRefs} {...props} />;
});

export default SidepanelListWrapper;
