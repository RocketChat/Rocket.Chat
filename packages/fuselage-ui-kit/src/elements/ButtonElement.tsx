import { Button, Throbber } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type ButtonElementProps = BlockProps<UiKit.ButtonElement>;

const ButtonElement = ({
  block,
  context,
  surfaceRenderer,
}: ButtonElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);
  const { style, url, text, value, secondary } = block;

  if (url) {
    return (
      <Button
        is='a'
        target='_blank'
        small
        minWidth='4ch'
        disabled={loading}
        href={url}
        primary={style === 'primary'}
        danger={style === 'danger'}
        success={style === 'success'}
        warning={style === 'warning'}
        secondary={secondary}
        onClick={action}
      >
        {loading ? (
          <Throbber />
        ) : (
          surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)
        )}
      </Button>
    );
  }

  return (
    <Button
      small
      minWidth='4ch'
      disabled={loading}
      primary={style === 'primary'}
      danger={style === 'danger'}
      success={style === 'success'}
      warning={style === 'warning'}
      secondary={secondary}
      value={value}
      onClick={action}
    >
      {loading ? (
        <Throbber />
      ) : (
        surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE)
      )}
    </Button>
  );
};

export default ButtonElement;
