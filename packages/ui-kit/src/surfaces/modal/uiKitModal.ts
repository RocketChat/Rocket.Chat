import type { ModalSurfaceLayout } from './UiKitParserModal.js';
import { createSurfaceRenderer } from '../../rendering/createSurfaceRenderer.js';

export const uiKitModal = createSurfaceRenderer<ModalSurfaceLayout[number]>();
