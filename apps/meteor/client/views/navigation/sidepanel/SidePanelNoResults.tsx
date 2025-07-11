import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import { SIDE_PANEL_GROUPS } from '../contexts/RoomsNavigationContext';
import type { AllGroupsKeys } from '../contexts/RoomsNavigationContext';

type SidePanelNoResultsProps = { currentTab: AllGroupsKeys; unreadOnly: boolean };

const SidePanelNoResults = ({ currentTab, unreadOnly }: SidePanelNoResultsProps) => {
	const { t } = useTranslation();

	switch (currentTab) {
		case SIDE_PANEL_GROUPS.MENTIONS:
			return (
				<GenericNoResults
					icon='at'
					title={unreadOnly ? t('No_unread_mentions') : t('No_mentions')}
					description={unreadOnly ? t('No_unread_mentions_description') : t('No_mentions_description')}
				/>
			);
		case SIDE_PANEL_GROUPS.FAVORITES:
			return (
				<GenericNoResults
					icon='star'
					title={unreadOnly ? t('No_unread_favorite_rooms') : t('No_favorite_rooms')}
					description={unreadOnly ? t('No_unread_favorite_rooms_description') : t('No_favorite_rooms_description')}
				/>
			);
		case SIDE_PANEL_GROUPS.DISCUSSIONS:
			return (
				<GenericNoResults
					icon='baloons'
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={unreadOnly ? t('No_unread_discussions_description') : t('No_discussions_description')}
				/>
			);
		default:
			return <GenericNoResults icon='inbox' title={unreadOnly ? t('No_unread_rooms') : t('No_rooms')} />;
	}
};

export default SidePanelNoResults;
