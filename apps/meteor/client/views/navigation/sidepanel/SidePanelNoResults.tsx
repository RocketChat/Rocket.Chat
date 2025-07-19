import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import { ALL_GROUPS } from '../contexts/RoomsNavigationContext';
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
		case ALL_GROUPS.MENTIONS:
			return (
				<GenericNoResults
					icon='at'
					title={unreadOnly ? t('No_unread_mentions') : t('No_mentions')}
					description={unreadOnly ? t('No_unread_mentions_description') : t('No_mentions_description')}
					{...buttonProps}
				/>
			);
		case ALL_GROUPS.FAVORITES:
			return (
				<GenericNoResults
					icon='star'
					title={unreadOnly ? t('No_unread_favorite_rooms') : t('No_favorite_rooms')}
					description={unreadOnly ? t('No_unread_favorite_rooms_description') : t('No_favorite_rooms_description')}
					{...buttonProps}
				/>
			);
		case ALL_GROUPS.DISCUSSIONS:
			return (
				<GenericNoResults
					icon='baloons'
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={unreadOnly ? t('No_unread_discussions_description') : t('No_discussions_description')}
					{...buttonProps}
				/>
			);
		case ALL_GROUPS.TEAMS:
			return (
				<GenericNoResults
					title={unreadOnly ? t('No_unread_channels_or_discussions') : t('No_channels_or_discussions')}
					description={unreadOnly ? t('No_unread_channels_or_discussions_description') : t('No_channels_or_discussions_description')}
					{...buttonProps}
				/>
			);
		case ALL_GROUPS.CHANNELS:
			return (
				<GenericNoResults
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={
						unreadOnly ? t('No_unread_discussions_channels_filter_description') : t('No_discussions_channels_filter_description')
					}
					{...buttonProps}
				/>
			);
		case ALL_GROUPS.DIRECT_MESSAGES:
			return (
				<GenericNoResults
					title={unreadOnly ? t('No_unread_discussions') : t('No_discussions')}
					description={unreadOnly ? t('No_unread_discussions_dms_filter_description') : t('No_discussions_dms_filter_description')}
					{...buttonProps}
				/>
			);
		default:
			return <GenericNoResults icon='inbox' title={unreadOnly ? t('No_unread_rooms') : t('No_rooms')} {...buttonProps} />;
	}
};

export default SidePanelNoResults;
