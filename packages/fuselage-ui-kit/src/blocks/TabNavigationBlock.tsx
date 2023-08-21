import { Tabs } from '@rocket.chat/fuselage';
import type { ExperimentalTabNavigationBlock } from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useState } from 'react';

import { TabElement } from '../elements/TabElement';
import type { BlockProps } from '../utils/BlockProps';

type TabNavigationBlockProps = BlockProps<ExperimentalTabNavigationBlock>;

const TabNavigationBlock = (
  blockProps: TabNavigationBlockProps
): ReactElement => {
  const {
    block: { tabs },
    context,
    surfaceRenderer,
  } = blockProps;

  const [selected, select] = useState<number>();

  return (
    <Tabs marginBlock={24}>
      {tabs.map((innerBlock, idx) => {
        if (selected !== undefined) {
          innerBlock.selected = idx === selected;
        }

        return (
          <TabElement
            key={`${innerBlock.blockId}_${idx}`}
            index={idx}
            context={context}
            surfaceRenderer={surfaceRenderer}
            block={innerBlock}
            select={select}
          />
        );
      })}
    </Tabs>
  );
};

export default memo(TabNavigationBlock);
