import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import { useContext } from 'react';

import { context, editorTabsToggleAction } from '../../../Context';
import ToggleTabs from '../../ToggleTabs';
import ActionBlockEditor from './ActionBlockEditor';
import ActionPreviewEditor from './ActionPreviewEditor';
import FlowDiagram from '../../../Pages/FlowDiagram';
import PrototypeContainer from '../../PtototypeContainer/PrototypeContainer';

enum TabsItem {
  ActionBlock,
  ActionPreview,
  FlowDiagram,
  Prototype,
}

const tabsItem = {
  [TabsItem.ActionBlock]: {
    name: 'Action Block',
    Container: ActionBlockEditor,
  },
  [TabsItem.ActionPreview]: {
    name: 'Action Preview',
    Container: ActionPreviewEditor,
  },
  [TabsItem.FlowDiagram]: {
    name: 'Flow Diagram',
    Container: FlowDiagram,
  },
  [TabsItem.Prototype]: { name: 'Prototype', Container: PrototypeContainer },
} as const;

const EditorPanel: FC = () => {
  const {
    state: { editorTabsToggle },
    dispatch,
  } = useContext(context);

  const toggleTabsHandler = (index: number) => {
    dispatch(editorTabsToggleAction(index));
  };

  const tabChangeStyle = (index: number) => {
    return css`
      transition: 0.5s ease;
      left: calc(-100% * ${index});
    `;
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
          tabsItem={Object.values(tabsItem).map((item) => item.name)}
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
            className={tabChangeStyle(editorTabsToggle)}
          >
            {Object.values(tabsItem).map(({ Container }, index) => (
              <>
                {index === editorTabsToggle ? (
                  <Container />
                ) : (
                  <Box w="100%" h="100%" />
                )}
              </>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
export default EditorPanel;
