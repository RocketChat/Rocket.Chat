import { ActionTypes } from "../reducer";

export type ActiveProjectAction = {
  type: ActionTypes.ActiveProject,
  payload: string,
};

export const activeProjectAction = (payload: string): ActiveProjectAction => ({
  type: ActionTypes.ActiveProject,
  payload,
});
