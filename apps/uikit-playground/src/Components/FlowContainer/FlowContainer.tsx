import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import ReactFlow, {
	MiniMap,
	Background,
	addEdge,
	updateEdge,
	type Node,
	type Viewport,
	type ReactFlowInstance,
	useReactFlow,
	type Connection,
	type Edge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import ConnectionLine from './ConnectionLine';
import ControlButton from './ControlButtons';
import UIKitWrapper from './UIKitWrapper/UIKitWrapper';
import { FlowParams } from './utils';
import { context } from '../../Context';
import { updateNodesAndViewPortAction } from '../../Context/action/updateNodesAndViewPortAction';
import { useNodesAndEdges } from '../../hooks/useNodesAndEdges';

const FlowContainer = () => {
	const { dispatch } = useContext(context);

	const { nodes, edges, Viewport, onNodesChange, onEdgesChange, setEdges } = useNodesAndEdges();
	const { setViewport } = useReactFlow();

	const nodeTypes = useMemo(
		() => ({
			custom: UIKitWrapper,
		}),
		// used to rerender edge lines on reorder payload
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[edges],
	);

	const [rfInstance, setRfInstance] = useState<ReactFlowInstance>();
	const edgeUpdateSuccessful = useRef(true);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source === connection.target) return;
			const newEdge = {
				...connection,
				type: FlowParams.edgeType,
				markerEnd: FlowParams.markerEnd,
				style: FlowParams.style,
			};
			setEdges((eds) => addEdge(newEdge, eds));
		},
		[setEdges],
	);

	const onEdgeUpdateStart = useCallback(() => {
		edgeUpdateSuccessful.current = false;
	}, []);

	const onEdgeUpdate = useCallback(
		(oldEdge: Edge<unknown>, newConnection: Connection) => {
			edgeUpdateSuccessful.current = true;
			setEdges((els) => updateEdge(oldEdge, newConnection, els));
		},
		[setEdges],
	);

	const onEdgeUpdateEnd = useCallback(
		(_: MouseEvent | TouchEvent, edge: Edge<unknown>) => {
			if (!edgeUpdateSuccessful.current) {
				setEdges((eds) => {
					return eds.filter((e) => e.id !== edge.id);
				});
			}
			edgeUpdateSuccessful.current = true;
		},
		[setEdges],
	);

	const onNodeDragStop = () => {
		if (!rfInstance?.toObject()) return;
		const { nodes, viewport }: { nodes: Node[]; viewport: Viewport } = rfInstance.toObject();
		dispatch(updateNodesAndViewPortAction({ nodes, viewport }));
	};

	const onInit = (instance: ReactFlowInstance) => {
		setRfInstance(instance);
		if (Viewport) setViewport(Viewport);
	};

	return (
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
			<Background color='#aaa' gap={16} />
		</ReactFlow>
	);
};

export default FlowContainer;
