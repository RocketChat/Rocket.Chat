import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import TabNavigationBlock from '../blocks/TabNavigationBlock';
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
      'callout',
      'tab_navigation',
    ]);
  }

  tab_navigation(
    block: UiKit.ExperimentalTabNavigationBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <TabNavigationBlock
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
