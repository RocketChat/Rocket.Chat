import type { MultiStaticSelectElement } from '@rocket.chat/ui-kit';
import { act, renderHook } from '@testing-library/react-hooks';

import { useUiKitState } from './useUiKitState';

const multiStaticSelectElement: MultiStaticSelectElement = {
  type: 'multi_static_select',
  placeholder: { type: 'plain_text', text: 'placeholder test' },
  options: [{ text: { type: 'plain_text', text: 'A' }, value: 'A' }],
  appId: 'test_app',
  blockId: 'multi_static_select_block',
  actionId: 'multi_static_select',
};

it("should MultiSelectElement with dispatchActionConfig equal ['on_item_selected'] update value correctly", async () => {
  multiStaticSelectElement.dispatchActionConfig = ['on_item_selected'];

  const { result } = renderHook(() =>
    useUiKitState(multiStaticSelectElement, 0)
  );

  // First interaction
  const event = { target: { value: ['A'] } };
  await act(async () => result.current[1](event));

  expect(result.current[0].value).toContain('A');

  // Second interaction
  event.target.value = ['A', 'B'];
  await act(async () => result.current[1](event));

  event.target.value.map((value) =>
    expect(result.current[0].value).toContain(value)
  );

  // Third interaction
  event.target.value = ['B'];
  await act(async () => result.current[1](event));

  expect(result.current[0].value).not.toContain('A');
  expect(result.current[0].value).toContain('B');
});
