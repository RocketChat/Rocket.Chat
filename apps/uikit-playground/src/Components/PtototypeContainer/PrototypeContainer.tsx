import { useContext, useMemo, useState } from 'react';
import { context } from '../../Context';
import { Box, Scrollable } from '@rocket.chat/fuselage';
import PrototypeRender from '../PrototypeRender/PrototypeRender';

const PrototypeContainer = () => {
  const {
    state: { projects, activeProject, screens },
  } = useContext(context);

  const [currentScreenID, setCurrentScreenID] = useState<string>(
    projects[activeProject].screens[0]
  );

  const activeActions = useMemo(() => {
    return projects[activeProject]?.flowEdges.map((edge) => edge.sourceHandle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject, projects, projects[activeProject].flowEdges]);

  if (!projects[activeProject].screens.length) return null;

  const { surface, blocks } =
    screens[currentScreenID]?.payload ||
    screens[projects[activeProject].screens[0]].payload;

  return (
    <Scrollable vertical>
      <Box w="100%" h="100%">
        <PrototypeRender
          surface={surface}
          blocks={blocks}
          activeActions={activeActions as string[]}
          flowEdges={projects[activeProject].flowEdges}
          onSelectAction={setCurrentScreenID}
        />
      </Box>
    </Scrollable>
  );
};

export default PrototypeContainer;
