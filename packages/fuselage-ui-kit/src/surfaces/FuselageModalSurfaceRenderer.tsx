import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';

export class FuselageModalSurfaceRenderer extends FuselageSurfaceRenderer {
  public constructor() {
    super([
      'actions',
      'context',
      'divider',
      'image',
      'input',
      'section',
      'preview',
      'callout',
    ]);
  }
}
