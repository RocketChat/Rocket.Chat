import { Node, Viewport } from 'reactflow';
import { ActionTypes } from '../reducer';

type PayloadType = {
  nodes: Node[];
  viewport: Viewport;
};

export type UpdateNodesAndViewPortAction = {
  type: ActionTypes.UpdateNodesAndViewPort;
  payload: PayloadType;
};

export const updateNodesAndViewPortAction = (
  payload: PayloadType
): UpdateNodesAndViewPortAction => ({
  type: ActionTypes.UpdateNodesAndViewPort,
  payload,
});
