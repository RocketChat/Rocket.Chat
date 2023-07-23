import { MarkerType } from 'reactflow';
import { useContext, useMemo } from 'react';
import { context } from '../Context';
export function useNodesAndEdges() {
  const {
    state: { screens, projects, activeProject },
  } = useContext(context);

  const nodes = useMemo(() => {
    const prevNodes = projects[activeProject].flowNodes;
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const activeScreens = projects[activeProject].screens.map(
      (id) => screens[id]
    );
    activeScreens.map((screen, i) => {
      if (prevNodes.map((node) => node.id).includes(screen.id)) return;

      const degrees = i * (360 / 8);
      const radians = degrees * (Math.PI / 180);
      const x = 2500 * Math.cos(radians) + center.x;
      const y = 2500 * Math.sin(radians) + center.y;

      prevNodes.push({
        id: screen.id,
        type: 'custom',
        position: { x, y },
        data: screen.id,
      });
    });
    return prevNodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edges = projects[activeProject].flowEdges;
  const Viewport = projects[activeProject].viewport;

  return { nodes, edges, Viewport };
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
