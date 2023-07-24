import { Tabs } from '@rocket.chat/fuselage';
import type { ExperimentalTabNavigationBlock } from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useEffect, useState } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import { UnstableTabElement } from '../elements/UntableTabElement';

type UnstableTabNavigationBlockProps = BlockProps<ExperimentalTabNavigationBlock>;

const TabNavigationBlock = (blockProps: UnstableTabNavigationBlockProps): ReactElement => {

  const { block: {tabs}, context, surfaceRenderer } = blockProps;

  const [selected, select] = useState<number>();

  useEffect(() => {
    if(selected !== undefined) {
      tabs.map((tab, idx) => {
        tab.selected = idx === selected;
      });
    }
  }, [selected, tabs]);

  return <Tabs marginBlock='x24'>
    {
      tabs.map((innerBlock, idx) => {
        return <UnstableTabElement key={`${innerBlock.blockId}_${idx}`} index={idx} context={context} surfaceRenderer={surfaceRenderer} block={innerBlock} select={select} />
      })
    }
  </Tabs>
};

export default memo(TabNavigationBlock);
