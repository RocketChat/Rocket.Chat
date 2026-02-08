import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEffect, useContext, useCallback } from 'react';

import { updatePayloadAction, context } from '../../Context';
import useCodeMirror from '../../hooks/useCodeMirror';
import intendCode from '../../utils/intendCode';
import { IPayload } from '../../Context/initialState';
import useFormatCodeMirrorValue from '../../hooks/useFormatCodeMirrorValue';

type CodeMirrorProps = {
  extensions?: Extension[];
};

const BlockEditor = ({ extensions }: CodeMirrorProps) => {
  const {
    state: { screens, activeScreen },
    dispatch,
  } = useContext(context);

  const { editor, changes, setValue } = useCodeMirror(
    extensions,
    intendCode(screens[activeScreen]?.payload)
  );
  const debounceValue = useDebouncedValue(changes, 1500);

  const handleFormatCode = useCallback(
    (
      parsedCode: IPayload,
      prettifiedCode: { formatted: string; cursorOffset: number }
    ) => {
      dispatch(
        updatePayloadAction({
          blocks: parsedCode.blocks,
          surface: parsedCode.surface,
        })
      );
      setValue(prettifiedCode.formatted, {
        cursor: prettifiedCode.cursorOffset,
      });
    },
    [dispatch, setValue]
  );

  useFormatCodeMirrorValue(handleFormatCode, debounceValue);

  useEffect(() => {
    if (!screens[activeScreen]?.changedByEditor) {
      setValue(intendCode(screens[activeScreen]?.payload), {});
    }
  }, [
    screens[activeScreen]?.payload.blocks,
    screens[activeScreen]?.payload.surface,
    screens[activeScreen]?.changedByEditor,
    activeScreen,
    setValue,
  ]);

  useEffect(() => {
    setValue(intendCode(screens[activeScreen]?.payload), {});
  }, [activeScreen, screens[activeScreen]?.payload.blocks, screens[activeScreen]?.payload.surface, setValue]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default BlockEditor;
