import { Divider, Icon, SidebarV2Item, SidebarV2ItemTitle, Box } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import { useRoomsListContext, SidePanelFilters } from '../views/root/MainLayout/RoomsListContext';

const SidebarFilters = () => {
	const { t } = useTranslation();
	const favoritesEnabled = useUserPreference('sidebarShowFavorites', true);
	const showOmnichannel = useOmnichannelEnabled();

	const {
		currentFilter: { filter, onlyUnReads },
		setCurrentFilter,
	} = useRoomsListContext();

	return (
		<>
			<Box role='group' mb={8}>
				<SidebarV2Item
					selected={filter === SidePanelFilters.ALL}
					onClick={() => setCurrentFilter({ onlyUnReads, filter: SidePanelFilters.ALL })}
				>
					<Icon size='x20' name='hash' />
					<SidebarV2ItemTitle>{t('All')}</SidebarV2ItemTitle>
				</SidebarV2Item>
				<SidebarV2Item
					selected={filter === SidePanelFilters.MENTIONS}
					onClick={() => setCurrentFilter({ filter: SidePanelFilters.MENTIONS, onlyUnReads })}
				>
					<Icon size='x20' name='at' />
					<SidebarV2ItemTitle>{t('Mentions')}</SidebarV2ItemTitle>
				</SidebarV2Item>
				{favoritesEnabled && (
					<SidebarV2Item selected={filter === SidePanelFilters.STARRED}>
						<Icon size='x20' name='star' />
						<SidebarV2ItemTitle onClick={() => setCurrentFilter({ filter: SidePanelFilters.STARRED, onlyUnReads })}>
							Starred
						</SidebarV2ItemTitle>
					</SidebarV2Item>
				)}
				<SidebarV2Item selected={filter === SidePanelFilters.DISCUSSIONS}>
					<Icon size='x20' name='baloons' />
					<SidebarV2ItemTitle onClick={() => setCurrentFilter({ filter: SidePanelFilters.DISCUSSIONS, onlyUnReads })}>
						{t('Discussions')}
					</SidebarV2ItemTitle>
				</SidebarV2Item>
			</Box>
			<Divider borderColor='stroke-light' mb={0} mi={16} />
			{showOmnichannel && (
				<>
					<Box mb={8}>
						<SidebarV2Item
							selected={filter === SidePanelFilters.IN_PROGRESS}
							onClick={() => setCurrentFilter({ filter: SidePanelFilters.IN_PROGRESS, onlyUnReads })}
						>
							<Icon size='x20' name='user-arrow-right' />
							<SidebarV2ItemTitle>{t('In_progress')}</SidebarV2ItemTitle>
						</SidebarV2Item>
						<SidebarV2Item
							selected={filter === SidePanelFilters.QUEUE}
							onClick={() => setCurrentFilter({ filter: SidePanelFilters.QUEUE, onlyUnReads })}
						>
							<Icon size='x20' name='burger-arrow-left' />
							<SidebarV2ItemTitle>{t('Queue')}</SidebarV2ItemTitle>
						</SidebarV2Item>
						<SidebarV2Item
							selected={filter === SidePanelFilters.ON_HOLD}
							onClick={() => setCurrentFilter({ filter: SidePanelFilters.ON_HOLD, onlyUnReads })}
						>
							<Icon size='x20' name='pause-unfilled' />
							<SidebarV2ItemTitle>{t('On_Hold')}</SidebarV2ItemTitle>
						</SidebarV2Item>
					</Box>
					<Divider borderColor='stroke-light' mb={0} mi={16} />
				</>
			)}
		</>
	);
};

export default SidebarFilters;
