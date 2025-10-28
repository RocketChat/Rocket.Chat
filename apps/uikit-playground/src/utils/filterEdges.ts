import { Edge } from 'reactflow';

export const filterEdges = (
  edges: Edge[],
  activeActionIds: string[],
  sourceId: string
) => {
  return edges.filter(
    (edge) =>
      sourceId !== edge.source ||
      activeActionIds.includes(edge.sourceHandle || '')
  );
};
