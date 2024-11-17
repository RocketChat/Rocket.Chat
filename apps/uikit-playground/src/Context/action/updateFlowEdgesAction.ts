import { Edge } from 'reactflow';
import { ActionTypes } from '../reducer';

export type UpdateFlowEdgesAction = {
  type: ActionTypes.UpdateFlowEdges;
  payload: Edge[];
};

export const updateFlowEdgesAction = (
  payload: Edge[]
): UpdateFlowEdgesAction => ({
  type: ActionTypes.UpdateFlowEdges,
  payload,
});
