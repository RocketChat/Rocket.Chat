import { ActionTypes } from "../reducer";

export type SurfaceAction = {
  type: ActionTypes.Surface,
  payload: number,
};

export const surfaceAction = (payload: number): SurfaceAction => ({
  type: ActionTypes.Surface,
  payload,
});
