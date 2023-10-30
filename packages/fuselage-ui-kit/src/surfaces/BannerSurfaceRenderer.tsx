import {
  FuselageSurfaceRenderer,
  renderTextObject,
} from './FuselageSurfaceRenderer';

export class BannerSurfaceRenderer extends FuselageSurfaceRenderer {
  plain_text = renderTextObject;

  mrkdwn = renderTextObject;
}
