import { Box, Scrollable } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import BlockEditor from '../../CodeEditor/BlockEditor';
import { actionBlockExtensions } from '../../CodeEditor/Extensions/Extensions';

const ActionBlockEditor: FC = () => (
  <Scrollable vertical>
    <Box
      position="relative"
      height={'100%'}
      width={'100%'}
      zIndex={1}
      bg={'#f6f9fc'}
      display={'flex'}
      borderInlineStart={'var(--default-border)'}
      overflow={'auto'}
    >
      <BlockEditor extensions={actionBlockExtensions} />
    </Box>
  </Scrollable>
);

export default ActionBlockEditor;
