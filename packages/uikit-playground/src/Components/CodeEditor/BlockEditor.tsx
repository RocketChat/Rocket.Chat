import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import json5 from 'json5';
import { useEffect, useContext } from 'react';

import { updatePayloadAction, context } from '../../Context';
import useCodeMirror from '../../hooks/useCodeMirror';
import codePrettier from '../../utils/codePrettier';

type CodeMirrorProps = {
  extensions?: Extension[],
};

const BlockEditor = ({ extensions }: CodeMirrorProps) => {
  const {
    state: { screens, activeScreen },
    dispatch,
  } = useContext(context);
  const { editor, changes, setValue } = useCodeMirror(
    extensions,
    JSON.stringify(screens[activeScreen].payload, undefined, 4)
  );
  const debounceValue = useDebouncedValue(changes?.value, 1500);

  useEffect(() => {
    if (!changes?.isDispatch) {
      try {
        const parsedCode = json5.parse(changes.value);
        dispatch(updatePayloadAction({ payload: parsedCode }));
      } catch (e) {
        // do nothing
      }
    }
  }, [changes?.value]);

  useEffect(() => {
    if (!changes?.isDispatch) {
      try {
        const prettierCode = codePrettier(changes.value, changes.cursor);
        setValue(prettierCode.formatted, {
          cursor: prettierCode.cursorOffset,
        });
      } catch (e) {
        // do nothing
      }
    }
  }, [debounceValue]);

  useEffect(() => {
    if (!screens[activeScreen].changedByEditor) {
      setValue(JSON.stringify(screens[activeScreen].payload, undefined, 4), {});
    }
  }, [screens[activeScreen].payload]);

  useEffect(() => {
    setValue(JSON.stringify(screens[activeScreen].payload, undefined, 4), {});
  }, [activeScreen]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default BlockEditor;
