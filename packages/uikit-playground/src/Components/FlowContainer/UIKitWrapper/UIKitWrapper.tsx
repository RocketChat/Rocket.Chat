import { Box } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './UIKitWrapper.scss';

import RenderPayload from '../../Preview/Display/RenderPayload/RenderPayload';
import SurfaceRender from '../../Preview/Display/Surface/SurfaceRender';
import { ScreenType } from '../../../Context/initialState';

const UIKitWrapper = ({ id, data }: { id: string; data: ScreenType }) => (
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
    <SurfaceRender type={data.surface}>
      {data.payload.map((payload, index) => (
        <Box pie="6px" className="uiKitWrapper">
          <Box
            position="relative"
            border="var(--default-border)"
            padding="10px"
          >
            <RenderPayload payload={[payload]} surface={data.surface} />
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

export default memo(UIKitWrapper);
