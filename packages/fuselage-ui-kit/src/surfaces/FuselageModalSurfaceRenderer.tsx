import { Markup } from '@rocket.chat/gazzodown';
import type { Markdown, PlainText, TextObject } from '@rocket.chat/ui-kit';
import { parse } from '@rocket.chat/message-parser';
import type { JSXElementConstructor, ReactElement } from 'react';
import { Fragment } from 'react';

import type { FuselageSurfaceRendererProps } from './FuselageSurfaceRenderer';
import { FuselageSurfaceRenderer } from './FuselageSurfaceRenderer';

export class FuselageModalSurfaceRenderer extends FuselageSurfaceRenderer {
  public constructor(allowedBlocks?: FuselageSurfaceRendererProps) {
    super(allowedBlocks);
  }

  public plainText = ({ text = '' }: PlainText) => <Fragment>{text}</Fragment>;

  public text({
    text,
    type,
  }: TextObject): ReactElement<
    any,
    string | JSXElementConstructor<any>
  > | null {
    if (type !== 'mrkdwn') {
      return this.plainText({ text, type });
    }

    return this.mrkdwn({ text, type });
  }

  public mrkdwn({ text = '' }: Markdown): ReactElement | null {
    return text ? <Markup tokens={parse(text, { emoticons: false })} /> : null;
  }
}
