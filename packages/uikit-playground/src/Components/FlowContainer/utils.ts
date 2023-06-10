import { MarkerType } from 'reactflow';

import type { ScreensType } from '../../Context/initialState';

export function createNodesAndEdges(screens: ScreensType) {
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  const nodes = Object.values(screens).map((screen, i) => {
    const degrees = i * (360 / 8);
    const radians = degrees * (Math.PI / 180);
    const x = 250 * Math.cos(radians) + center.x;
    const y = 250 * Math.sin(radians) + center.y;

    return {
      id: screen.id,
      type: 'custom',
      position: { x, y },
      data: screen,
    };
  });

  return { nodes };
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
