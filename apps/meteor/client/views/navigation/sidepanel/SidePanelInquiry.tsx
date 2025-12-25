import { memo } from 'react';

import { createSidePanel } from './SidePanelInternal';
import InquireSidePanelItem from './omnichannel/InquireSidePanelItem';

const SidePanelInquiry = createSidePanel(InquireSidePanelItem);

export default memo(SidePanelInquiry);
