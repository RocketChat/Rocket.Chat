import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer';
import type { ModalSurfaceLayout } from './UiKitParserModal';

export const uiKitModal = createSurfaceRenderer<ModalSurfaceLayout[number]>();
