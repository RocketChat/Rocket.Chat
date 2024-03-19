import { Box } from '@rocket.chat/fuselage';

import FlowContainer from '../Components/FlowContainer/FlowContainer';
import { ReactFlowProvider } from 'reactflow';
import { FC } from 'react';

const FlowDiagram: FC = () => (
  <Box w="100%" h="100%" position="relative">
    <ReactFlowProvider>
      <FlowContainer />
    </ReactFlowProvider>
  </Box>
);

export default FlowDiagram;
