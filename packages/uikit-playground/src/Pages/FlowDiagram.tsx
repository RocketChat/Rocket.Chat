import { Box } from '@rocket.chat/fuselage';

import FlowContainer from '../Components/FlowContainer/FlowContainer';
import { ReactFlowProvider } from 'reactflow';

const FlowDiagram = () => (
  <Box w="100%" h="100%" position="relative">
    <ReactFlowProvider>
      <FlowContainer />
    </ReactFlowProvider>
  </Box>
);

export default FlowDiagram;
