import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import type { uiKitBanner, uiKitContextualBar, uiKitMessage, uiKitModal } from '../surfaces';

type UiKitComponentProps = {
	render: typeof uiKitBanner | typeof uiKitMessage | typeof uiKitModal | typeof uiKitContextualBar;
	blocks: UiKit.LayoutBlock[];
};

export const UiKitComponent = ({ render, blocks }: UiKitComponentProps): ReactElement | null => render(blocks);
