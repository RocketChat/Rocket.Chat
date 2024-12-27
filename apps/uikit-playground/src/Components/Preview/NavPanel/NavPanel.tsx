import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import {
  context,
  previewTabsToggleAction,
  templatesToggleAction,
} from '../../../Context';
import SurfaceSelect from '../../SurfaceSelect';
import ToggleTabs from '../../ToggleTabs';

const NavPanel: FC = () => {
  const {
    state: { isMobile, isTablet, previewTabsToggle },
    dispatch,
  } = useContext(context);

  const toggleTabsHandler = (index: number) => {
    dispatch(previewTabsToggleAction(index));
  };

  const tabsItem: string[] = ['Preview', 'Editor'];
  return (
    <Box
      width={'100%'}
      height={'40px'}
      borderBlockEnd={'var(--default-border)'}
      display={'flex'}
      alignItems={'center'}
      zIndex={1}
      justifyContent={isMobile ? 'flex-end' : 'space-between'}
      bg={'alternative'}
      className={css`
        user-select: none;
      `}
    >
      {!isMobile && (
        <Box display="flex" alignItems="center" flexGrow={0} pis={4}>
          <SurfaceSelect />
          <Button
            mis="10px"
            small
            warning
            height={'max-content'}
            onClick={() => dispatch(templatesToggleAction(true))}
          >
            Templates
          </Button>
        </Box>
      )}
      {isTablet && (
        <ToggleTabs
          tabsItem={tabsItem}
          onChange={toggleTabsHandler}
          selectedTab={previewTabsToggle}
        />
      )}
    </Box>
  );
};

export default NavPanel;
