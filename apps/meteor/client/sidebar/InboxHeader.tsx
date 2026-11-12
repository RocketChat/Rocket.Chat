import { IconButton } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarPanelHeader from './components/SidebarPanelHeader';

type InboxHeaderProps = {
	searchId: string;
	searchButtonRef: Ref<HTMLButtonElement>;
	searchOpen: boolean;
	onToggleSearch: () => void;
};

const InboxHeader = ({ searchId, searchButtonRef, searchOpen, onToggleSearch }: InboxHeaderProps) => {
	const { t } = useTranslation();

	return (
		<SidebarPanelHeader title={t('Inbox')}>
			<IconButton
				ref={searchButtonRef}
				icon='magnifier'
				size='small'
				title={t('Search')}
				aria-label={t('Search_rooms')}
				aria-expanded={searchOpen}
				aria-controls={searchId}
				pressed={searchOpen}
				onClick={onToggleSearch}
			/>
		</SidebarPanelHeader>
	);
};

export default InboxHeader;
