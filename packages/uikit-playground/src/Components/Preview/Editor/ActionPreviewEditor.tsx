import { Box, Scrollable } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import { actionPreviewExtensions } from '../../CodeEditor/Extensions/Extensions';
import PreviewEditor from '../../CodeEditor/PreviewEditor';

const ActionPreviewEditor: FC = () => (
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
      <PreviewEditor extensions={actionPreviewExtensions} />
    </Box>
  </Scrollable>
);

export default ActionPreviewEditor;
