import type { OptionType } from '@rocket.chat/fuselage';
import {
  IconButton,
  PositionAnimated,
  Options,
  useCursor,
} from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { useRef, useCallback, useMemo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type OverflowElementProps = BlockProps<UiKit.OverflowElement>;

const OverflowElement = ({
  block,
  context,
}: OverflowElementProps): ReactElement => {
  const [{ loading }, action] = useUiKitState(block, context);
  const fromTextObjectToString = useStringFromTextObject();

  const fireChange = useCallback(
    ([value]: [UiKit.ActionOf<UiKit.OverflowElement>, string]) =>
      action({ target: { value } }),
    [action]
  );

  const options = useMemo<OptionType[]>(
    () =>
      block.options.map(({ value, text, url }) => [
        value,
        fromTextObjectToString(text) ?? '',
        undefined,
        undefined,
        undefined,
        url,
      ]),
    [block.options, fromTextObjectToString]
  );

  const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] =
    useCursor(-1, options, (selectedOption, [, hide]) => {
      fireChange([selectedOption[0] as string, selectedOption[1] as string]);
      reset();
      hide();
    });

  const ref = useRef<HTMLElement>(null);
  const onClick = useCallback(() => {
    ref.current?.focus();
    show();
  }, [show]);

  const handleSelection = useCallback(
    ([value, _label, _selected, _type, url]: OptionType) => {
      if (url) {
        window.open(url);
      }
      action({ target: { value: String(value) } });
      reset();
      hide();
    },
    [action, hide, reset]
  );

  return (
    <>
      <IconButton
        ref={ref}
        small
        onClick={onClick}
        onBlur={hide}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        disabled={loading}
        icon='kebab'
      />
      <PositionAnimated
        width='auto'
        visible={visible}
        anchor={ref}
        placement='bottom-start'
      >
        <Options onSelect={handleSelection} options={options} cursor={cursor} />
      </PositionAnimated>
    </>
  );
};

export default OverflowElement;
