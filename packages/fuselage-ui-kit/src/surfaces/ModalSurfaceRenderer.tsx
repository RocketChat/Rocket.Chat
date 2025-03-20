import {
  FuselageSurfaceRenderer,
  renderTextObject,
} from './FuselageSurfaceRenderer';

export class ModalSurfaceRenderer extends FuselageSurfaceRenderer {
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

  plain_text = renderTextObject;

  mrkdwn = renderTextObject;
}
