import type * as UiKit from '@rocket.chat/ui-kit';
import type { ComponentType, ReactElement, ReactNode } from 'react';

export const createSurfaceRenderer = <
  S extends UiKit.SurfaceRenderer<ReactElement>
>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SurfaceComponent: ComponentType<{ children: ReactNode }>,
  surfaceRenderer: S
) =>
  function Surface(
    blocks: readonly UiKit.LayoutBlock[],
    conditions: UiKit.Conditions = {}
  ): ReactElement {
    return (
      <SurfaceComponent>
        {surfaceRenderer.render(blocks, {
          engine: 'rocket.chat',
          ...conditions,
        })}
      </SurfaceComponent>
    );
  };
