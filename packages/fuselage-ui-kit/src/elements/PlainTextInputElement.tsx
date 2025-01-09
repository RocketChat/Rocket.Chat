import { TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ChangeEvent, ReactElement } from 'react';
import { memo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type PlainTextInputElementProps = BlockProps<UiKit.PlainTextInputElement>;

const PlainTextInputElement = ({
  block,
  context,
}: PlainTextInputElementProps): ReactElement => {
  const [{ loading, error, value, mutate, performAction }] = useUiKitState(
    block,
    context,
  );
  const fromTextObjectToString = useStringFromTextObject();

  const disabled = block.dispatchActionConfig?.includes('on_character_entered')
    ? false
    : loading;

  const placeholder = fromTextObjectToString(block.placeholder);

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    mutate(event.currentTarget.value);

    if (
      block.dispatchActionConfig?.includes('on_character_entered') ||
      block.dispatchActionConfig?.includes('on_item_selected') ||
      context === UiKit.BlockContext.ACTION ||
      context === UiKit.BlockContext.SECTION
    ) {
      performAction(event.currentTarget.value, event);
    }
  };

  if (block.multiline) {
    return (
      <TextAreaInput
        disabled={disabled}
        id={block.actionId}
        name={block.actionId}
        rows={6}
        error={error}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
      />
    );
  }

  return (
    <TextInput
      disabled={disabled}
      id={block.actionId}
      name={block.actionId}
      error={error}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
};

export default memo(PlainTextInputElement);
