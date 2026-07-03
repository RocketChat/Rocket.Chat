import type * as UiKit from '@rocket.chat/ui-kit';

import type { UiKitBanner, UiKitContextualBar, UiKitMessage, UiKitModal } from '../surfaces';

type UiKitComponentProps = {
	render: typeof UiKitBanner | typeof UiKitMessage | typeof UiKitModal | typeof UiKitContextualBar;
	blocks: UiKit.LayoutBlock[];
};

export const UiKitComponent = ({ render, blocks }: UiKitComponentProps) => render(blocks);
