import { SidepanelList } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarListNavigation } from '../../../sidebar/RoomList/useSidebarListNavigation';

type RoomListWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomSidepanelListWrapper = forwardRef(function RoomListWrapper(props: RoomListWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefs(ref, sidebarListRef);

	return <SidepanelList aria-label={t('Channels')} ref={mergedRefs} {...props} />;
});

export default RoomSidepanelListWrapper;
