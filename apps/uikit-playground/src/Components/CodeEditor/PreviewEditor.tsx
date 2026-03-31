import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useContext } from 'react';

import { context } from '../../Context';
import useCodeMirror from '../../hooks/useCodeMirror';
import intendCode from '../../utils/intendCode';

type CodeMirrorProps = {
  extensions?: Extension[];
};

const PreviewEditor = ({ extensions }: CodeMirrorProps) => {
  const {
    state: { screens, activeScreen },
  } = useContext(context);
  const { editor, setValue } = useCodeMirror(
    extensions,
    intendCode(screens[activeScreen]?.actionPreview)
  );

  useEffect(() => {
    setValue(intendCode(screens[activeScreen]?.actionPreview), {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens[activeScreen]?.actionPreview]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default PreviewEditor;
