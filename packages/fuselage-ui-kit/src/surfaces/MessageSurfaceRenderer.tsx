import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import VideoConferenceBlock from '../blocks/VideoConferenceBlock/VideoConferenceBlock';
import {
  FuselageSurfaceRenderer,
  renderTextObject,
} from './FuselageSurfaceRenderer';

export class FuselageMessageSurfaceRenderer extends FuselageSurfaceRenderer {
  public constructor() {
    super([
      'actions',
      'context',
      'divider',
      'image',
      'input',
      'section',
      'preview',
      'video_conf',
    ]);
  }

  plain_text = renderTextObject;

  mrkdwn = renderTextObject;

  video_conf(
    block: UiKit.VideoConferenceBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <VideoConferenceBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      );
    }

    return null;
  }
}
