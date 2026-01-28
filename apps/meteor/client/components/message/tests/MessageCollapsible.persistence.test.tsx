import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';

import MessageCollapsible from '../MessageCollapsible';
import * as storage from '../../../lib/collapsedMediaStorage';

beforeEach(() => {
  // simple in-memory localStorage mock
  let store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    },
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  // @ts-expect-error restore
  delete (window as any).localStorage;
});

test('persists collapsed state across unmount/mount using storageId', () => {
  const storageId = 'msg:test-1';

  const { getByTitle, queryByText, unmount } = render(
    <MessageCollapsible title='Test media' storageId={storageId}>
      <div>MEDIA_CONTENT</div>
    </MessageCollapsible>,
  );

  // initially expanded -> content visible
  expect(queryByText('MEDIA_CONTENT')).toBeTruthy();

  // find the collapse action by title and click it
  const collapseAction = getByTitle('Collapse');
  fireEvent.click(collapseAction);

  // content should be hidden
  expect(queryByText('MEDIA_CONTENT')).toBeNull();

  // storage should reflect collapsed state
  expect(storage.isCollapsed(storageId)).toBe(true);

  // unmount and remount
  unmount();

  const { queryByText: query2 } = render(
    <MessageCollapsible title='Test media' storageId={storageId}>
      <div>MEDIA_CONTENT</div>
    </MessageCollapsible>,
  );

  // on remount, content should still be hidden because persisted as collapsed
  expect(query2('MEDIA_CONTENT')).toBeNull();
});
