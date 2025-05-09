import { ActionTypes } from "../reducer";

export type DuplicateScreenAction = {
  type: ActionTypes.DuplicateScreen,
  payload: { id: string, name?: string },
};

export const duplicateScreenAction = (payload: {
  id: string,
  name?: string,
}): DuplicateScreenAction => ({
  type: ActionTypes.DuplicateScreen,
  payload,
});
