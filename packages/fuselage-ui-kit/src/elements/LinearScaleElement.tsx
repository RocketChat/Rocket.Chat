import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type LinearScaleElementProps = BlockProps<UiKit.LinearScaleElement>;

const LinearScaleElement = ({
  className,
  block,
  context,
  surfaceRenderer,
}: LinearScaleElementProps): ReactElement => {
  const {
    minValue = 0,
    maxValue = 10,
    initialValue,
    preLabel,
    postLabel,
  } = block;

  const [{ loading, value = initialValue, error }, action] = useUiKitState(
    block,
    context
  );

  const points = useMemo(
    () =>
      Array.from({ length: Math.max(maxValue - minValue + 1, 1) }, (_, i) =>
        String(minValue + i)
      ),
    [maxValue, minValue]
  );

  return (
    <Box
      display='flex'
      flexDirection='row'
      flexWrap='nowrap'
      alignItems='center'
    >
      {preLabel && (
        <Box fontScale='c2' paddingInlineEnd={8} textAlign='start'>
          {surfaceRenderer.renderTextObject(
            preLabel,
            0,
            UiKit.BlockContext.NONE
          )}
        </Box>
      )}
      <Box>
        <ButtonGroup
          className={className}
          align='center'
          marginInline={-2}
          minWidth={0}
        >
          {points.map((point, i) => (
            <Button
              key={i}
              className={point === String(value) ? 'active' : undefined}
              disabled={loading}
              danger={!!error}
              minWidth='4ch'
              small
              value={point}
              marginInline={2}
              flexShrink={1}
              onClick={action}
            >
              {surfaceRenderer.renderTextObject(
                {
                  type: 'plain_text',
                  text: String(i + minValue),
                },
                0,
                UiKit.BlockContext.NONE
              )}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
      {postLabel && (
        <Box fontScale='c2' paddingInlineStart={8} textAlign='end'>
          {surfaceRenderer.renderTextObject(
            postLabel,
            0,
            UiKit.BlockContext.NONE
          )}
        </Box>
      )}
    </Box>
  );
};

export default memo(LinearScaleElement);
