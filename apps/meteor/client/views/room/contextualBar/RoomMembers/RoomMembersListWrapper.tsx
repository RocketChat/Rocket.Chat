import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useMembersListNavigation } from './useMembersListNavigation';

export type RoomMembersListWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomMembersListWrapper = forwardRef(function RoomMembersListWrapper(
	props: RoomMembersListWrapperProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const { t } = useTranslation();
	const { membersListRef } = useMembersListNavigation();
	const mergedRefs = useMergedRefs(ref, membersListRef);

	return <div role='list' aria-label={t('Members')} ref={mergedRefs} {...props} />;
});

export default RoomMembersListWrapper;
