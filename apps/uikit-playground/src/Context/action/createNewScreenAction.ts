import { ActionTypes } from "../reducer";

export type CreateNewScreenAction = {
  type: ActionTypes.CreateNewScreen,
  payload?: string,
};

export const createNewScreenAction = (payload?: string): CreateNewScreenAction => ({
  type: ActionTypes.CreateNewScreen,
  payload,
});
