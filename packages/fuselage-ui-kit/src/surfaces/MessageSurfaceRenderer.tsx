import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const qc = new QueryClient();

import VideoConferenceBlock from '../blocks/VideoConferenceBlock/VideoConferenceBlock';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';

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

  video_conf(
    block: UiKit.VideoConferenceBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <QueryClientProvider client={qc}>
          <VideoConferenceBlock
            key={index}
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </QueryClientProvider>
      );
    }

    return null;
  }
}
