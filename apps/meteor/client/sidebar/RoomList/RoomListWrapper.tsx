import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomContainerComponentProps } from 'virtua';

import { useSidebarListNavigation } from './useSidebarListNavigation';

export type RoomListWrapperProps = CustomContainerComponentProps &
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> & {
		'data-testid'?: string;
	};

const RoomListWrapper = forwardRef(function RoomListWrapper(
	{ children, style, 'data-testid': dataTestId, ...props }: RoomListWrapperProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefs(ref, sidebarListRef);

	return (
		<div {...props} data-testid={dataTestId ?? 'virtuoso-item-list'} role='list' aria-label={t('Channels')} ref={mergedRefs} style={style}>
			{children}
		</div>
	);
});

export default RoomListWrapper;
