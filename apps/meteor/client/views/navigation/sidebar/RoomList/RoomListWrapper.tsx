import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarListNavigation } from './useSidebarListNavigation';
import { useMergedRefsV2 } from '../../../../hooks/useMergedRefsV2';

export type RoomListWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomListWrapper = forwardRef(function RoomListWrapper(props: RoomListWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefsV2(ref, sidebarListRef);

	return <div role='list' aria-label={t('Channels')} ref={mergedRefs} {...props} />;
});

export default RoomListWrapper;
