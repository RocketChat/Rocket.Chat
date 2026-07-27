import { Box } from '@rocket.chat/fuselage';
import { ReactFlowProvider } from 'reactflow';

import FlowContainer from '../Components/FlowContainer/FlowContainer';

const FlowDiagram = () => (
	<Box width='100%' height='100%' position='relative'>
		<ReactFlowProvider>
			<FlowContainer />
		</ReactFlowProvider>
	</Box>
);

export default FlowDiagram;
