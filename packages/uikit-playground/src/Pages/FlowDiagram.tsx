import { Box } from '@rocket.chat/fuselage';

import FlowContainer from '../Components/FlowContainer/FlowContainer';
import { ReactFlowProvider } from 'reactflow';

const FlowDiagram = () => (
  <Box w="100vW" h="100vh">
    <ReactFlowProvider>
      <FlowContainer />
    </ReactFlowProvider>
  </Box>
);

export default FlowDiagram;
