import { ActionTypes } from "../reducer";

export type EditorTabsToggleAction = {
  type: ActionTypes.EditorToggle,
  payload: number,
};

export const editorTabsToggleAction = (payload: number): EditorTabsToggleAction => ({
  type: ActionTypes.EditorToggle,
  payload,
});
