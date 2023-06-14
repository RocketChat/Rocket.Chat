import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import json5 from 'json5';
import { useEffect, useContext } from 'react';

import { context } from '../../Context';
import { docAction } from '../../Context/action';
import useCodeMirror from '../../hooks/useCodeMirror';
import codePrettier from '../../utils/codePrettier';

type CodeMirrorProps = {
  extensions?: Extension[];
};

const CodeEditor = ({ extensions }: CodeMirrorProps) => {
  const { state, dispatch } = useContext(context);
  const { editor, changes, setValue } = useCodeMirror(
    extensions,
    json5.stringify(state.doc.payload, undefined, 4)
  );
  const debounceValue = useDebouncedValue(changes?.value, 500);

  useEffect(() => {
    console.log('a');
    if (!changes?.isDispatch) {
      try {
        const parsedCode = json5.parse(changes.value);
        dispatch(
          docAction({
            payload: parsedCode,
            changedByEditor: false,
          })
        );

        dispatch(docAction({ payload: parsedCode }));
      } catch (e) {
        console.log(e);
        // do nothing
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changes?.value]);

  useEffect(() => {
    console.log('b');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceValue]);

  useEffect(() => {
    console.log('c');
    if (!state.doc.changedByEditor) {
      setValue(JSON.stringify(state.doc.payload, undefined, 4), {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.doc.payload]);

  return (
    <>
      <Box display='grid' height='100%' width={'100%'} ref={editor} />
    </>
  );
};

export default CodeEditor;
