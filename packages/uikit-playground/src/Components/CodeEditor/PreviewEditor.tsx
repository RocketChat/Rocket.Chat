import type { Extension } from '@codemirror/state';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useContext } from 'react';

import { context } from '../../Context';
import useCodeMirror from '../../hooks/useCodeMirror';

type CodeMirrorProps = {
  extensions?: Extension[];
};

const PreviewEditor = ({ extensions }: CodeMirrorProps) => {
  const {
    state: { screens, activeScreen },
  } = useContext(context);
  const { editor, setValue } = useCodeMirror(extensions, `{}`);

  useEffect(() => {
    setValue(
      JSON.stringify(screens[activeScreen]?.actionPreview, undefined, 4),
      {}
    );
  }, [screens[activeScreen]?.actionPreview]);

  return (
    <>
      <Box display="grid" height="100%" width={'100%'} ref={editor} />
    </>
  );
};

export default PreviewEditor;
