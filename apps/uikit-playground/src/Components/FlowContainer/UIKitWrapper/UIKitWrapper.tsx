import { Box } from '@rocket.chat/fuselage';
import { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import './UIKitWrapper.scss';

import RenderPayload from '../../RenderPayload/RenderPayload';
import SurfaceRender from '../../Preview/Display/Surface/SurfaceRender';
import { idType } from '../../../Context/initialState';
import { context } from '../../../Context';

const UIKitWrapper = ({ id, data }: { id: string; data: idType }) => {
  const {
    state: { screens },
  } = useContext(context);
  if (!screens[data]) return null;
  const { blocks, surface } = screens[data].payload;
  return (
    <Box
      padding="10px"
      border="var(--default-border)"
      bg="white"
      borderRadius={'10px'}
    >
      <Handle
        type="target"
        className={'react-flow-targetHandle'}
        position={Position.Left}
        id={`${id}`}
      />
      <SurfaceRender type={surface}>
        {blocks.map((block, index) => (
          <Box key={index} pie="6px" className="uiKitWrapper">
            <Box
              position="relative"
              border="var(--default-border)"
              padding="10px"
            >
              <RenderPayload blocks={[block]} surface={surface} />
              <Handle
                type="source"
                className="react-flow-sourceHandle"
                position={Position.Right}
                id={block.actionId}
              />
            </Box>
          </Box>
        ))}
      </SurfaceRender>
    </Box>
  );
};

export default UIKitWrapper;
