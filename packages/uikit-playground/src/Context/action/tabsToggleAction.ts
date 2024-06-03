import { ActionTypes } from "../reducer";

export type TabsToggleAction = {
  type: ActionTypes.EditorToggle,
  payload: number,
};

export const tabsToggleAction = (payload: number): TabsToggleAction => ({
  type: ActionTypes.EditorToggle,
  payload,
});
