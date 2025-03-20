/* eslint-disable react-hooks/exhaustive-deps */
import { Edge, MarkerType, useEdgesState, useNodesState } from 'reactflow';
import { useContext, useEffect } from 'react';
import { context, updateFlowEdgesAction } from '../Context';
export function useNodesAndEdges() {
  const {
    state: { screens, projects, activeProject },
    dispatch,
  } = useContext(context);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState([]);

  const setEdges = (callback: (e: Edge[]) => Edge[]) => {
    const _edges = callback(edges);
    _setEdges(_edges);
    dispatch(updateFlowEdgesAction(_edges));
  };

  useEffect(() => {
    const prevNodes = projects[activeProject].flowNodes;
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const activeScreens = projects[activeProject].screens.map(
      (id) => screens[id]
    );
    activeScreens.map((screen, i) => {
      if (prevNodes.map((node) => node.id).includes(screen.id)) return;

      const degrees = i * (360 / 8);
      const radians = degrees * (Math.PI / 180);
      const x = 250 * activeScreens.length * Math.cos(radians) + center.x;
      const y = 250 * activeScreens.length * Math.sin(radians) + center.y;

      prevNodes.push({
        id: screen.id,
        type: 'custom',
        position: { x, y },
        data: screen.id,
      });
    });
    setNodes(prevNodes);
  }, [
    activeProject,
    projects,
    screens,
    JSON.stringify(screens),
    projects[activeProject].screens,
    setNodes,
  ]);
  useEffect(() => {
    const _edges = projects[activeProject].flowEdges;
    _setEdges(_edges);
  }, [
    activeProject,
    projects,
    screens,
    projects[activeProject].flowEdges,
    _setEdges,
  ]);
  const Viewport = projects[activeProject]?.viewport;

  return {
    nodes,
    edges,
    Viewport,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
  };
}

export const FlowParams = {
  edgeType: 'smoothstep',
  markerEnd: {
    type: MarkerType.Arrow,
  },
  style: {
    strokeWidth: 2,
    stroke: 'var(--RCPG-primary-color)',
  },
};
