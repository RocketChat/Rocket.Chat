import type { FuselageSurfaceRendererProps } from './FuselageSurfaceRenderer';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';

export class FuselageModalSurfaceRenderer extends FuselageSurfaceRenderer {
  public constructor(allowedBlocks?: FuselageSurfaceRendererProps) {
    super(allowedBlocks);
  }
}
