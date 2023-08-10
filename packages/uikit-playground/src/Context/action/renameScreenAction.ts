import { ActionTypes } from "../reducer";

type payloadType = {
    id: string,
    name: string,
};

export type RenameScreenAction = {
  type: ActionTypes.RenameScreen,
  payload: payloadType,
};

export const renameScreenAction = (payload: payloadType): RenameScreenAction => ({
  type: ActionTypes.RenameScreen,
  payload,
});