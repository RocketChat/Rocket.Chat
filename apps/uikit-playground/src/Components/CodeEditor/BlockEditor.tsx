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

  const activeScreenData = screens[activeScreen];
  const payloadBlocks = activeScreenData?.payload.blocks;
  const payloadSurface = activeScreenData?.payload.surface;
  const changedByEditor = activeScreenData?.changedByEditor;

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
    if (!changedByEditor) {
      setValue(intendCode(activeScreenData?.payload), {});
    }
  }, [payloadBlocks, payloadSurface, changedByEditor, activeScreen, setValue]);

  useEffect(() => {
    setValue(intendCode(activeScreenData?.payload), {});
  }, [activeScreen, payloadBlocks, payloadSurface, setValue]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default BlockEditor;
