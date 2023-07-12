import { useCallback, useContext, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  updateEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { context, updateFlowEdgesAction } from '../../Context';
import ConnectionLine from './ConnectionLine';
import UIKitWrapper from './UIKitWrapper';
import { FlowParams, createNodesAndEdges } from './utils';
import ControlButton from './ControlButtons';

const nodeTypes = {
  custom: UIKitWrapper,
};

const FlowContainer = () => {
  const {
    state: { screens, projects, activeProject },
    dispatch,
  } = useContext(context);

  const { nodes: initialNodes } = createNodesAndEdges(
    projects[activeProject].screens.map((id) => screens[id])
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    projects[activeProject].flowEdges
  );
  const edgeUpdateSuccessful = useRef(true);

  const onConnect = useCallback(
    (params) => {
      window.console.log({ params });
      if (params.source === params.target) return;
      const newEdge = {
        ...params,
        type: FlowParams.edgeType,
        markerEnd: FlowParams.markerEnd,
        style: FlowParams.style,
      };
      dispatch(updateFlowEdgesAction(newEdge));
      setEdges((eds) => addEdge(newEdge, eds));
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
        <ControlButton />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </>
  );
};

export default FlowContainer;
