import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarListNavigation } from './useSidebarListNavigation';

export type RoomListWrapperProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const RoomListWrapper = ({ ref, ...props }: RoomListWrapperProps) => {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefs(ref, sidebarListRef);

	return <div role='list' aria-label={t('Channels')} ref={mergedRefs} {...props} />;
};

export default RoomListWrapper;
