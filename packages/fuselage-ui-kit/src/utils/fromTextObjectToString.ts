import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const fromTextObjectToString = (
  surfaceRenderer: UiKit.SurfaceRenderer<ReactElement>,
  textObject: UiKit.TextObject,
  index: number
): string | undefined => {
  const element = surfaceRenderer.renderTextObject(
    textObject,
    index,
    UiKit.BlockContext.NONE
  );

  if (!element) {
    return undefined;
  }

  return renderToStaticMarkup(element);
};
