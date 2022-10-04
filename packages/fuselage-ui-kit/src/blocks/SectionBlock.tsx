import { Box, Flex, Grid } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import Fields from './SectionBlock.Fields';

type SectionBlockProps = BlockProps<UiKit.SectionBlock>;

const SectionBlock = ({
  className,
  block,
  surfaceRenderer,
}: SectionBlockProps): ReactElement => {
  const { text, fields } = block;

  const accessoryElement = useMemo(
    () =>
      block.accessory
        ? {
            appId: block.appId,
            blockId: block.blockId,
            ...block.accessory,
          }
        : undefined,
    [block.appId, block.blockId, block.accessory]
  );

  return (
    <Grid className={className}>
      <Grid.Item>
        {text && (
          <Box is='span' fontScale='p2' color='default'>
            {surfaceRenderer.text(text)}
          </Box>
        )}
        {fields && <Fields fields={fields} surfaceRenderer={surfaceRenderer} />}
      </Grid.Item>
      {block.accessory && (
        <Flex.Item grow={0}>
          <Grid.Item>
            {accessoryElement
              ? surfaceRenderer.renderSectionAccessoryBlockElement(
                  accessoryElement,
                  0
                )
              : null}
          </Grid.Item>
        </Flex.Item>
      )}
    </Grid>
  );
};

export default memo(SectionBlock);
