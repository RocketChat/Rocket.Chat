import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useContext } from 'react';

import { context, editorTabsToggleAction } from '../../../Context';
import ToggleTabs from '../../ToggleTabs';
import ActionBlockEditor from './ActionBlockEditor';
import ActionPreviewEditor from './ActionPreviewEditor';
import FlowDiagram from '../../../Pages/FlowDiagram';
import PrototypeContainer from '../../PtototypeContainer/PrototypeContainer';

const EditorPanel: FC = () => {
  enum TabsItem {
    ActionBlock,
    ActionPreview,
    FlowDiagram,
    Prototype,
  }

  const tabsItem = {
    [TabsItem.ActionBlock]: 'Action Block',
    [TabsItem.ActionPreview]: 'Action Preview',
    [TabsItem.FlowDiagram]: 'Flow Diagram',
    [TabsItem.Prototype]: 'Prototype',
  };
  const {
    state: { editorTabsToggle },
    dispatch,
  } = useContext(context);

  const toggleTabsHandler = (index: number) => {
    dispatch(editorTabsToggleAction(index));
  };

  const tabChangeStyle = () => {
    switch (editorTabsToggle) {
      case TabsItem.ActionBlock:
        return css`
          transition: 0.5s ease;
          left: 0;
        `;
      case TabsItem.ActionPreview:
        return css`
          transition: 0.5s ease;
          left: -100%;
        `;

      case TabsItem.FlowDiagram:
        return css`
          transition: 0.5s ease;
          left: -200%;
        `;
      case TabsItem.Prototype:
        return css`
          transition: 0.5s ease;
          left: -300%;
        `;
    }
  };

  return (
    <Box width={'100%'} height={'100%'}>
      <Box
        position="relative"
        width={'100%'}
        height={'100%'}
        overflow="hidden"
        className={[
          css`
            user-select: none;
          `,
        ]}
      >
        <ToggleTabs
          tabsItem={Object.values(tabsItem)}
          onChange={toggleTabsHandler}
          selectedTab={editorTabsToggle}
        />
        <Box
          position="relative"
          width={'100%'}
          height="calc(100% - 40px)"
          flexDirection="column"
        >
          <Box
            position="absolute"
            width={`calc(100% * ${Object.values(tabsItem).length})`}
            height={'100%'}
            display={'flex'}
            borderBlockStart="var(--default-border)"
            className={tabChangeStyle()}
          >
            <ActionBlockEditor />
            <ActionPreviewEditor />
            <FlowDiagram />
            <PrototypeContainer />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
export default EditorPanel;
