import { ActionTypes } from "../reducer";

export type DeleteProjectAction = {
  type: ActionTypes.DeleteProject,
  payload: string,
};

export const deleteProjectAction = (payload: string): DeleteProjectAction => ({
  type: ActionTypes.DeleteProject,
  payload,
});