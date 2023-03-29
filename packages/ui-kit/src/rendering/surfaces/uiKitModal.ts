import { createSurfaceRenderer } from '../createSurfaceRenderer';
import type { ModalSurfaceLayout } from './UiKitParserModal';

export const uiKitModal = createSurfaceRenderer<unknown, ModalSurfaceLayout[number]>();
