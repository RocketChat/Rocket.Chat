import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import { sidePanelFiltersConfig } from '../contexts/RoomsNavigationContext';
import type { AllGroupsKeys } from '../contexts/RoomsNavigationContext';

type SidePanelNoResultsProps = { currentTab: AllGroupsKeys };

const SidePanelNoResults = ({ currentTab }: SidePanelNoResultsProps) => {
	const { t } = useTranslation();

	switch (currentTab) {
		case 'mentions':
			return (
				<GenericNoResults icon={sidePanelFiltersConfig.mentions.icon} title={t('No_mentions')} description={t('No_mentions_description')} />
			);
		case 'favorites':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.favorites.icon}
					title={t('No_favorite_rooms')}
					description={t('No_favorite_rooms_description')}
				/>
			);
		case 'discussions':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.discussions.icon}
					title={t('No_discussions')}
					description={t('No_discussions_description')}
				/>
			);
		case 'inProgress':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.inProgress.icon}
					title={t('No_chats_in_progress')}
					description={t('No_chats_in_progress_description')}
				/>
			);
		case 'queue':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.queue.icon}
					title={t('No_chats_in_queue')}
					description={t('No_chats_in_queue_description')}
				/>
			);
		case 'onHold':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.onHold.icon}
					title={t('No_chats_on_hold')}
					description={t('No_chats_on_hold_description')}
				/>
			);
		case 'teams':
			return (
				<GenericNoResults icon={null} title={t('No_channels_or_discussions')} description={t('No_channels_or_discussions_description')} />
			);
		case 'channels':
			return <GenericNoResults icon={null} title={t('No_discussions')} description={t('No_discussions_channels_filter_description')} />;
		case 'directMessages':
			return <GenericNoResults icon={null} title={t('No_discussions')} description={t('No_discussions_dms_filter_description')} />;
		default:
			return <GenericNoResults icon='inbox' title={t('No_rooms')} description={t('No_rooms_description')} />;
	}
};

export default SidePanelNoResults;
