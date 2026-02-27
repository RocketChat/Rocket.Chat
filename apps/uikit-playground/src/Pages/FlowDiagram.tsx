import { Box } from '@rocket.chat/fuselage';
import { type FC } from 'react';
import { ReactFlowProvider } from 'reactflow';

import FlowContainer from '../Components/FlowContainer/FlowContainer';

const FlowDiagram: FC = () => (
  <Box w="100%" h="100%" position="relative">
    <ReactFlowProvider>
      <FlowContainer />
    </ReactFlowProvider>
  </Box>
);

export default FlowDiagram;
