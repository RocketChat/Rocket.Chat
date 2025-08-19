import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import { sidePanelFiltersConfig } from '../contexts/RoomsNavigationContext';
import type { AllGroupsKeys } from '../contexts/RoomsNavigationContext';

type SidePanelNoResultsProps = { currentTab: AllGroupsKeys; unreadOnly: boolean; toggleUnreadOnly: () => void };

const SidePanelNoResults = ({ currentTab, unreadOnly, toggleUnreadOnly }: SidePanelNoResultsProps) => {
	const { t } = useTranslation();

	const buttonProps = unreadOnly
		? {
				buttonAction: toggleUnreadOnly,
				buttonTitle: t('Show_all'),
				buttonPrimary: false,
			}
		: {};

	switch (currentTab) {
		case 'mentions':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.mentions.icon}
					title={unreadOnly ? t('No_unread_mentions') : t('No_mentions')}
					description={unreadOnly ? t('No_unread_mentions_description') : t('No_mentions_description')}
					{...buttonProps}
				/>
			);
		case 'favorites':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.favorites.icon}
					title={unreadOnly ? t('No_unread_favorite_rooms') : t('No_favorite_rooms')}
					description={unreadOnly ? t('No_unread_favorite_rooms_description') : t('No_favorite_rooms_description')}
					{...buttonProps}
				/>
			);
		case 'discussions':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.discussions.icon}
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={unreadOnly ? t('No_unread_discussions_description') : t('No_discussions_description')}
					{...buttonProps}
				/>
			);
		case 'inProgress':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.inProgress.icon}
					title={unreadOnly ? t('No_unread_chats_in_progress') : t('No_chats_in_progress')}
					description={unreadOnly ? t('No_unread_chats_in_progress_description') : t('No_chats_in_progress_description')}
					{...buttonProps}
				/>
			);
		case 'queue':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.queue.icon}
					title={unreadOnly ? t('No_unread_chats_in_queue') : t('No_chats_in_queue')}
					description={unreadOnly ? t('No_unread_chats_in_queue_description') : t('No_chats_in_queue_description')}
					{...buttonProps}
				/>
			);
		case 'onHold':
			return (
				<GenericNoResults
					icon={sidePanelFiltersConfig.onHold.icon}
					title={unreadOnly ? t('No_unread_chats_on_hold') : t('No_chats_on_hold')}
					description={unreadOnly ? t('No_unread_chats_on_hold_description') : t('No_chats_on_hold_description')}
					{...buttonProps}
				/>
			);
		case 'teams':
			return (
				<GenericNoResults
					icon={null}
					title={unreadOnly ? t('No_unread_channels_or_discussions') : t('No_channels_or_discussions')}
					description={unreadOnly ? t('No_unread_channels_or_discussions_description') : t('No_channels_or_discussions_description')}
					{...buttonProps}
				/>
			);
		case 'channels':
			return (
				<GenericNoResults
					icon={null}
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={
						unreadOnly ? t('No_unread_discussions_channels_filter_description') : t('No_discussions_channels_filter_description')
					}
					{...buttonProps}
				/>
			);
		case 'directMessages':
			return (
				<GenericNoResults
					icon={null}
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={unreadOnly ? t('No_unread_discussions_dms_filter_description') : t('No_discussions_dms_filter_description')}
					{...buttonProps}
				/>
			);
		default:
			return (
				<GenericNoResults
					icon='inbox'
					title={unreadOnly ? t('No_unread_rooms') : t('No_rooms')}
					description={unreadOnly ? t('No_unread_rooms_description') : t('No_rooms_description')}
					{...buttonProps}
				/>
			);
	}
};

export default SidePanelNoResults;
