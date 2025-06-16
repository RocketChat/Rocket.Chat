/* eslint-disable react-hooks/exhaustive-deps */
import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEffect, useContext } from 'react';

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

  useFormatCodeMirrorValue(
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
    debounceValue
  );

  useEffect(() => {
    if (!screens[activeScreen]?.changedByEditor) {
      setValue(intendCode(screens[activeScreen]?.payload), {});
    }
  }, [
    screens[activeScreen]?.payload.blocks,
    screens[activeScreen]?.payload.surface,
    activeScreen,
  ]);

  useEffect(() => {
    setValue(intendCode(screens[activeScreen]?.payload), {});
  }, [activeScreen]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default BlockEditor;
