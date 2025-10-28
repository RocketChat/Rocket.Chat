import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from 'codemirror';
import { useCallback, useEffect, useState, useRef } from 'react';

export type ICodeMirrorChanges = {
  value: string;
  isDispatch: boolean;
  cursor?: number;
};

export default function useCodeMirror(extensions?: Extension[], doc?: string) {
  const view = useRef<EditorView>(undefined);
  const [element, setElement] = useState<HTMLElement>();
  const [changes, setChanges] = useState<ICodeMirrorChanges>({
    value: '[]',
    isDispatch: true,
    cursor: 0,
  });

  const editor = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setElement(node);
  }, []);

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      setChanges({
        value: view.current?.state?.doc.toString() || '',
        // @ts-expect-error Property 'annotations' does not exist on type 'Transaction'. Did you mean 'annotation'?
        isDispatch: update?.transactions[0]?.annotations?.length === 1 || false,
        cursor: view.current?.state?.selection?.main?.head || 0,
      });
    }
  });

  const setValue = (
    value: string,
    {
      from,
      to,
      cursor,
    }: {
      from?: number;
      to?: number;
      cursor?: number;
    }
  ) => {
    try {
      view.current?.dispatch({
        changes: {
          from: from || 0,
          to: to || view.current.state.doc.length,
          insert: value || '',
        },
        selection: { anchor: cursor || 0 },
      });
    } catch (e) {
      // do nothing;
    }
  };

  useEffect(() => {
    if (!element) return;

    view.current = new EditorView({
      state: EditorState.create({
        doc: doc || '',
        extensions: [updateListener, ...(extensions || [])],
      }),
      parent: element,
    });

    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return { editor, changes, setValue };
}
