import { memo } from 'react';

import { createSidePanel } from './SidePanelInternal';
import RoomSidePanelItem from './SidepanelItem/RoomSidePanelItem';

const SidePanel = createSidePanel(RoomSidePanelItem);

export default memo(SidePanel);
