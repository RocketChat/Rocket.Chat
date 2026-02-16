import { UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';

import { MedsenseUiKitModalSurface } from './MedsenseFormSurfaceRenderer';
import './medsenseUIKit.css';

type MedsenseUiKitModalProps = {
	blocks: UiKit.ModalView['blocks'];
};

const MedsenseUiKitModal = ({ blocks }: MedsenseUiKitModalProps) => <UiKitComponent render={MedsenseUiKitModalSurface} blocks={blocks} />;

export default MedsenseUiKitModal;
