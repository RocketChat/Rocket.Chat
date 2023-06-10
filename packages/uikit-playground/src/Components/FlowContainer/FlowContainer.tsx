import { useCallback, useContext, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  updateEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { context } from '../../Context';
import ConnectionLine from './ConnectionLine';
import UIKitWrapper from './UIKitWrapper';
import { FlowParams, createNodesAndEdges } from './utils';

const nodeTypes = {
  custom: UIKitWrapper,
};

const FlowContainer = () => {
  const {
    state: { screens },
  } = useContext(context);

  const { nodes: initialNodes } = createNodesAndEdges(screens);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const edgeUpdateSuccessful = useRef(true);

  const onConnect = useCallback(
    (params) => {
      if (params.source === params.target) return;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: FlowParams.edgeType,
            markerEnd: FlowParams.markerEnd,
            style: FlowParams.style,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, []);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeUpdateSuccessful.current = true;
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        connectionLineComponent={ConnectionLine}
      >
        <MiniMap zoomable pannable />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </>
  );
};

export default FlowContainer;
