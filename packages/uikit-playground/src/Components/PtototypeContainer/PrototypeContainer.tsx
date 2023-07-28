import { useContext, useMemo, useState } from 'react';
import { context } from '../../Context';
import { Box, Scrollable } from '@rocket.chat/fuselage';
import PrototypeRender from '../PrototypeRender/PrototypeRender';

const PrototypeContainer = () => {
  const {
    state: { projects, activeProject, screens },
  } = useContext(context);
  window.console.log(projects[activeProject].flowEdges);
  const [currentScreenID, setCurrentScreenID] = useState<string>(
    projects[activeProject].screens[0]
  );
  const { surface, payload } = screens[currentScreenID];

  const activeActions = useMemo(() => {
    return projects[activeProject]?.flowEdges.map((edge) => edge.sourceHandle);
  }, [activeProject, projects]);
  return (
    <Scrollable vertical>
      <Box
        w="100%"
        h="100%"
        paddingBlock={'40px'}
        display="flex"
        justifyContent="center"
      >
        <PrototypeRender
          surface={surface}
          payload={payload}
          activeActions={activeActions as string[]}
          flowEdges={projects[activeProject].flowEdges}
          onSelectAction={setCurrentScreenID}
        />
      </Box>
    </Scrollable>
  );
};

export default PrototypeContainer;
