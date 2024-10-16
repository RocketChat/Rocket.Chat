import { ActionTypes } from '../reducer';

export type CreateNewProjectAction = {
  type: ActionTypes.CreateNewProject;
  payload?: string;
};

export const createNewProjectAction = (
  payload?: string
): CreateNewProjectAction => ({
  type: ActionTypes.CreateNewProject,
  payload,
});
