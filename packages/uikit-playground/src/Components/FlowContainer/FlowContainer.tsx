import { useCallback, useContext, useRef, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  addEdge,
  updateEdge,
  Node,
  Viewport,
  ReactFlowInstance,
  useReactFlow,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { context, updateFlowEdgesAction } from '../../Context';
import ConnectionLine from './ConnectionLine';
import UIKitWrapper from './UIKitWrapper/UIKitWrapper';
import { FlowParams } from './utils';
import ControlButton from './ControlButtons';
import { useNodesAndEdges } from '../../hooks/useNodesAndEdges';
import { updateNodesAndViewPortAction } from '../../Context/action/updateNodesAndViewPortAction';

const nodeTypes = {
  custom: UIKitWrapper,
};

const FlowContainer = () => {
  const { dispatch } = useContext(context);

  const { nodes, edges, Viewport, onNodesChange, onEdgesChange, setEdges } =
    useNodesAndEdges();
  const { setViewport } = useReactFlow();

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance>();
  const edgeUpdateSuccessful = useRef(true);

  const onConnect = useCallback(
    (params) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setEdges]
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeUpdateSuccessful.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNodeDragStop = () => {
    if (!rfInstance?.toObject()) return;
    const { nodes, viewport }: { nodes: Node[]; viewport: Viewport } =
      rfInstance.toObject();
    dispatch(updateNodesAndViewPortAction({ nodes, viewport }));
  };

  const onInit = (instance: ReactFlowInstance) => {
    setRfInstance(instance);
    Viewport && setViewport(Viewport);
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeUpdate={onEdgeUpdate}
        onNodeDragStop={onNodeDragStop}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        minZoom={0.1}
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
