import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useItemListNavigation } from '../../../../hooks/useItemListNavigation';

export type RoomMembersListWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomMembersListWrapper = forwardRef(function RoomMembersListWrapper(
	props: RoomMembersListWrapperProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const { t } = useTranslation();
	const membersListRef = useItemListNavigation();
	const mergedRefs = useMergedRefs(ref, membersListRef);

	return <div role='list' aria-label={t('Members')} ref={mergedRefs} {...props} />;
});

export default RoomMembersListWrapper;
