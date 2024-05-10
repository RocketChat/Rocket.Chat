import { ActionTypes } from "../reducer";

export type SidebarToggleAction = {
  type: ActionTypes.SidebarToggle,
  payload: boolean,
};

export const sidebarToggleAction = (payload: boolean): SidebarToggleAction => ({
  type: ActionTypes.SidebarToggle,
  payload,
});
