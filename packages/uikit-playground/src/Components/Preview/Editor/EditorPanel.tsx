import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext } from 'react';

import { context, editorTabsToggleAction } from '../../../Context';
import ToggleTabs from '../../ToggleTabs';
import ActionBlockEditor from './ActionBlockEditor';
import ActionPreviewEditor from './ActionPreviewEditor';

const EditorPanel: FC = () => {
  const tabsItem: string[] = ['Action Block', 'Action Preview'];
  const {
    state: { editorTabsToggle },
    dispatch,
  } = useContext(context);

  const toggleTabsHandler = (index: number) => {
    dispatch(editorTabsToggleAction(index));
  };

  const tabChangeStyle = () => {
    switch (editorTabsToggle) {
      case 0:
        return css`
          transition: 0.5s ease;
          left: 0;
        `;
      case 1:
        return css`
          transition: 0.5s ease;
          left: -100%;
        `;
    }
  };

  return (
    <Box width={'100%'} height={'100%'}>
      <Box
        position='relative'
        width={'100%'}
        height={'100%'}
        overflow='hidden'
        className={[
          css`
            user-select: none;
          `,
        ]}
      >
        <ToggleTabs
          tabsItem={tabsItem}
          onChange={toggleTabsHandler}
          selectedTab={editorTabsToggle}
        />
        <Box
          position='relative'
          width='100%'
          height='calc(100% - 40px)'
          flexDirection='column'
        >
          <Box
            position='absolute'
            width={'200%'}
            height={'100%'}
            display={'flex'}
            borderBlockStart='var(--default-border)'
            className={tabChangeStyle()}
          >
            <ActionBlockEditor />
            <ActionPreviewEditor />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
export default EditorPanel;
