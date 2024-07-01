import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, Ref } from 'react';
import React, { forwardRef } from 'react';

import { useSidebarListNavigation } from './useSidebarListNavigation';

const RoomListWrapper = forwardRef(function RoomListWrapper(props: HTMLAttributes<HTMLDivElement>, ref: Ref<HTMLDivElement>) {
	const t = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefs(ref, sidebarListRef);

	return <div role='list' aria-label={t('Channels')} ref={mergedRefs} {...props} />;
});

export default RoomListWrapper;
