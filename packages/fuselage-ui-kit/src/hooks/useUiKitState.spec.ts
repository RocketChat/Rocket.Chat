import {
  BlockContext,
  type MultiStaticSelectElement,
} from '@rocket.chat/ui-kit';
import { act, renderHook } from '@testing-library/react';

import { useUiKitState } from './useUiKitState';

describe('state function', () => {
  const context = BlockContext.NONE;

  it('should handle arrays', async () => {
    const element: MultiStaticSelectElement = {
      type: 'multi_static_select',
      placeholder: { type: 'plain_text', text: '' },
      options: [],
      initialValue: ['A', 'B'],
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
    };

    const { result } = renderHook(() => useUiKitState(element, context));

    await act(async () => {
      const [, state] = result.current;
      await state({
        target: {
          value: ['C', 'D'],
        },
      });
    });

    expect(result.current[0].value).toEqual(['C', 'D']);
  });
});

describe('action function', () => {
  const context = BlockContext.ACTION;

  it('should handle arrays', async () => {
    const element: MultiStaticSelectElement = {
      type: 'multi_static_select',
      placeholder: { type: 'plain_text', text: '' },
      options: [],
      initialValue: ['A', 'B'],
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
    };

    const { result } = renderHook(() => useUiKitState(element, context));

    await act(async () => {
      const [, action] = result.current;
      await action({
        target: {
          value: ['C', 'D'],
        },
      });
    });

    expect(result.current[0].value).toEqual(['C', 'D']);
  });
});
