import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';

import type { SidePanelFiltersKeys } from '../../contexts/RoomsNavigationContext';
import { useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelAll = ({ currentTab }: { currentTab: SidePanelFiltersKeys }) => {
	const rooms = useSidePanelRoomsListTab(currentTab);
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();

	return (
		<SidePanel
			headerTitle={currentTab as TranslationKey}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelAll;
