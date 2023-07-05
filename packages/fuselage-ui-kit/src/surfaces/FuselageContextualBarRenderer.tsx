import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';

export class FuselageContextualBarSurfaceRenderer extends FuselageSurfaceRenderer {
  public constructor() {
    super([
      'actions',
      'context',
      'divider',
      'image',
      'input',
      'section',
      'preview',
    ]);
  }
}
