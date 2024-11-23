import { ActionTypes } from "../reducer";

export type PreviewTabsToggleAction = {
  type: ActionTypes.PreviewToggle,
  payload: number,
};

export const previewTabsToggleAction = (payload: number): PreviewTabsToggleAction => ({
  type: ActionTypes.PreviewToggle,
  payload,
});
