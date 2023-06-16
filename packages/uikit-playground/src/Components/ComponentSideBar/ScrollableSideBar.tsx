import { css } from '@rocket.chat/css-in-js';
import { Scrollable, Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

import BlocksTree from '../../Payload/BlocksTree';
import DropDown from '../DropDown';

const ScrollableSideBar: FC = () => (
  <Scrollable vertical>
    <Box
      flexGrow={1}
      mbs='39px'
      borderBlockStart='var(--default-border)'
      bg={'var(--primaryBackgroundColor)'}
      className={css`
        box-shadow: var(--dropdown-box-shadow);
      `}
    >
      <DropDown BlocksTree={BlocksTree} />
    </Box>
  </Scrollable>
);

export default ScrollableSideBar;
