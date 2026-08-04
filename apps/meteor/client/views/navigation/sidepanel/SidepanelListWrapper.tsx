import { SidepanelList } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Components } from 'react-virtuoso';

import { useSidebarListNavigation } from '../sidebar/RoomList/useSidebarListNavigation';

const SidepanelListWrapper: Components['List'] = forwardRef(function SidepanelListWrapper(props, ref) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefs(ref, sidebarListRef);

	return <SidepanelList aria-label={t('Channels')} ref={mergedRefs} {...props} />;
});

export default SidepanelListWrapper;
