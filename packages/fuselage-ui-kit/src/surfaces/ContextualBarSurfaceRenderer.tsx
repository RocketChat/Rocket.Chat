import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import TabNavigationBlock from '../blocks/TabNavigationBlock';
import { AppIdProvider } from '../contexts/AppIdContext';
import UsersSelectElement from '../elements/UsersSelectElement/UsersSelectElement';
import {
  FuselageSurfaceRenderer,
  renderTextObject,
} from './FuselageSurfaceRenderer';

export class ContextualBarSurfaceRenderer extends FuselageSurfaceRenderer {
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

  plain_text = renderTextObject;

  mrkdwn = renderTextObject;

  users_select(
    block: UiKit.UsersSelectElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.FORM) {
      return (
        <UsersSelectElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      );
    }

    return null;
  }

  tab_navigation(
    block: UiKit.ExperimentalTabNavigationBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <TabNavigationBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }
}
