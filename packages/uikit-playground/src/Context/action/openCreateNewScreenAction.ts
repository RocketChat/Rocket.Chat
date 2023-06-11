import { ActionTypes } from "../reducer";

export type OpenCreateNewScreenAction = {
  type: ActionTypes.OpenCreateNewScreen,
  payload: boolean,
};

export const openCreateNewScreenAction = (payload: boolean): OpenCreateNewScreenAction => ({
  type: ActionTypes.OpenCreateNewScreen,
  payload,
});
