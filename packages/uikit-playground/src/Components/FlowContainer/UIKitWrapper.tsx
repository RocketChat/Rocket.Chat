import { Box } from '@rocket.chat/fuselage';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { docType } from '../../Context/initialState';
import RenderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import SurfaceRender from '../Preview/Display/Surface/SurfaceRender';

const UIKitWrapper = ({ id, data }: { id: string, data: docType }) => (
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
        <Box
          position="relative"
          border="var(--default-border)"
          padding="10px"
          className="uiKitWrapper"
        >
          <RenderPayload payload={[payload]} surface={data.surface} />
          <Handle
            type="source"
            className="react-flow-sourceHandle"
            position={Position.Right}
            id={`${id}-${index}`}
          />
        </Box>
      ))}
    </SurfaceRender>
  </Box>
);

export default memo(UIKitWrapper);
