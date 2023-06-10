import { useCallback, useContext } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { context } from '../../Context';
import UIKitWrapper from './UIKitWrapper';

const nodeTypes = {
  custom: UIKitWrapper,
};

const FlowContainer = () => {
  const {
    state: { screens },
  } = useContext(context);

  //   const initialNodes = [
  //     { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  //     { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
  //   ];
  const initialNodes = Object.values(screens).map((screen) => ({
    id: screen.id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: screen,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      attributionPosition="top-right"
      nodeTypes={nodeTypes}
    >
      <MiniMap zoomable pannable />
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
};

export default FlowContainer;
