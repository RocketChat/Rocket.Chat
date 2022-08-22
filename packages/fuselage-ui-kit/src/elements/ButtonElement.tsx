import { Button, Throbber } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type ButtonElementProps = BlockProps<UiKit.ButtonElement>;

const ButtonElement = ({
  block,
  context,
  surfaceRenderer,
}: ButtonElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);

  if (block.url) {
    return (
      <Button
        is='a'
        target='_blank'
        href={block.url}
        disabled={loading}
        primary={block.style === 'primary'}
        danger={block.style === 'danger'}
        minWidth='4ch'
        small
        onClick={action}
      >
        {loading ? (
          <Throbber />
        ) : (
          surfaceRenderer.renderTextObject(
            block.text,
            0,
            UiKit.BlockContext.NONE
          )
        )}
      </Button>
    );
  }

  return (
    <Button
      disabled={loading}
      primary={block.style === 'primary'}
      danger={block.style === 'danger'}
      minWidth='4ch'
      small
      value={block.value}
      onClick={action}
    >
      {loading ? (
        <Throbber />
      ) : (
        surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)
      )}
    </Button>
  );
};

export default ButtonElement;
