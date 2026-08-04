import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useMembersListNavigation } from './useMembersListNavigation';

export type RoomMembersListWrapperProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const RoomMembersListWrapper = ({ ref, ...props }: RoomMembersListWrapperProps) => {
	const { t } = useTranslation();
	const { membersListRef } = useMembersListNavigation();
	const mergedRefs = useMergedRefs(ref, membersListRef);

	return <div role='list' aria-label={t('Members')} ref={mergedRefs} {...props} />;
};

export default RoomMembersListWrapper;
