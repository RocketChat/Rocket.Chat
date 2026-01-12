import { ActionTypes } from "../reducer";
import { SurfaceOptions } from '../../Components/Preview/Display/Surface/constant';

export type SurfaceAction = {
  type: ActionTypes.Surface,
  payload: SurfaceOptions,
};

export const surfaceAction = (payload: SurfaceOptions): SurfaceAction => ({
  type: ActionTypes.Surface,
  payload,
});
