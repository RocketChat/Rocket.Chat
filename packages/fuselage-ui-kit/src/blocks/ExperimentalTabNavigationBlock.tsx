import { Tabs } from '@rocket.chat/fuselage';
import type { ExperimentalTabNavigationBlock } from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useState } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import { ExperimentalTabElement } from '../elements/ExperimentalTabElement';

type ExperimentalTabNavigationBlockProps = BlockProps<ExperimentalTabNavigationBlock>;

const ExperimentalTabNavigationBlock = (blockProps: ExperimentalTabNavigationBlockProps): ReactElement => {

  const { block: {tabs}, context, surfaceRenderer } = blockProps;

  const [selected, select] = useState<number>();

  return <Tabs marginBlock='x24'>
    {
      tabs.map((innerBlock, idx) => {
        if(selected !== undefined) {
          innerBlock.selected = idx === selected;
        }

        return <ExperimentalTabElement key={`${innerBlock.blockId}_${idx}`} index={idx} context={context} surfaceRenderer={surfaceRenderer} block={innerBlock} select={select} />
      })
    }
  </Tabs>
};

export default memo(ExperimentalTabNavigationBlock);
