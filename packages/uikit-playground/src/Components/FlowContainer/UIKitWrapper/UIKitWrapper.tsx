import { Box } from '@rocket.chat/fuselage';
import { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import './UIKitWrapper.scss';

import RenderPayload from '../../Preview/Display/RenderPayload/RenderPayload';
import SurfaceRender from '../../Preview/Display/Surface/SurfaceRender';
import { idType } from '../../../Context/initialState';
import { context } from '../../../Context';

const UIKitWrapper = ({ id, data }: { id: string; data: idType }) => {
  const {
    state: { screens },
  } = useContext(context);
  const { payload, surface } = screens[data];
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
        {payload.map((payload, index) => (
          <Box key={index} pie="6px" className="uiKitWrapper">
            <Box
              position="relative"
              border="var(--default-border)"
              padding="10px"
            >
              <RenderPayload payload={[payload]} surface={surface} />
              <Handle
                type="source"
                className="react-flow-sourceHandle"
                position={Position.Right}
                id={payload.actionId}
              />
            </Box>
          </Box>
        ))}
      </SurfaceRender>
    </Box>
  );
};

export default UIKitWrapper;
