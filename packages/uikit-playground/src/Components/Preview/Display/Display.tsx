import { Box, Scrollable } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import Surface from './Surface/Surface';

const Display: FC = () => (
  <Scrollable vertical>
    <Box
      height={'100%'}
      width={'100%'}
      borderInlineStart='var(--default-border)'
    >
      <Surface />
    </Box>
  </Scrollable>
);

export default Display;
