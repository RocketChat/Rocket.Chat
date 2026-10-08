import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomContainerComponentProps } from 'virtua';

import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useSidebarListNavigation } from '../RoomList/useSidebarListNavigation';

type TeamsListWrapperProps = CustomContainerComponentProps & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'>;

const TeamsListWrapper = forwardRef(function TeamsListWrapper(
	{ children, style, ...props }: TeamsListWrapperProps,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();
	const mergedRefs = useMergedRefsV2(ref, sidebarListRef);

	return (
		<div {...props} data-testid='teams-panel-list' role='list' aria-label={t('Teams')} ref={mergedRefs} style={style}>
			{children}
		</div>
	);
});

export default TeamsListWrapper;
