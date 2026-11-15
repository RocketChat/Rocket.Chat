import { SidepanelList } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Components } from 'react-virtuoso';

import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import { useSidebarListNavigation } from '../sidebar/RoomList/useSidebarListNavigation';

const SidepanelListWrapper: Components['List'] = forwardRef(function SidepanelListWrapper(props, ref) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefsV2(ref, sidebarListRef);

	return <SidepanelList aria-label={t('Channels')} ref={mergedRefs} {...props} />;
});

export default SidepanelListWrapper;
