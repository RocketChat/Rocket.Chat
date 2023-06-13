import { Box, Scrollable } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import CodeEditor from '../../CodeEditor';
import extensions from '../../CodeEditor/Extensions';

const Editor: FC = () => (
  <Scrollable vertical>
    <Box
      position='relative'
      height={'100%'}
      width={'100%'}
      zIndex={1}
      bg={'#f6f9fc'}
      display={'flex'}
      borderInlineStart={'var(--default-border)'}
      overflow={'auto'}
    >
      <CodeEditor extensions={extensions} />
    </Box>
  </Scrollable>
);

export default Editor;
