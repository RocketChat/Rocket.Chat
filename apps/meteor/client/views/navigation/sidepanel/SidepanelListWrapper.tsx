import { SidepanelList } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarListNavigation } from '../sidebar/RoomList/useSidebarListNavigation';

type SidepanelListWrapperProps = HTMLAttributes<HTMLDivElement>;

const SidepanelListWrapper = forwardRef(function SidepanelListWrapper(props: SidepanelListWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	const { t } = useTranslation();
	const { sidebarListRef } = useSidebarListNavigation();

	return (
		<SidepanelList aria-label={t('Channels')} ref={sidebarListRef}>
			<div ref={ref} {...props} />
		</SidepanelList>
	);
});

export default SidepanelListWrapper;
