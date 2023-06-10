import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import type { docType } from '../../Context/initialState';
import RenderPayload from '../Preview/Display/RenderPayload/RenderPayload';
import SurfaceRender from '../Preview/Display/Surface/SurfaceRender';

const UIKitWrapper = ({ id, data }: { id: string, data: docType }) => {
  console.log(data, id);
  return (
    <Box>
      <SurfaceRender type={data.surface}>
        <RenderPayload payload={data.payload} surface={data.surface} />
      </SurfaceRender>
    </Box>
  );
};

export default UIKitWrapper;
