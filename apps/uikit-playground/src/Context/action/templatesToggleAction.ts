import { ActionTypes } from "../reducer";

export type TemplatesToggleAction = {
  type: ActionTypes.TemplatesToggle,
  payload: boolean,
};

export const templatesToggleAction = (payload: boolean): TemplatesToggleAction => ({
  type: ActionTypes.TemplatesToggle,
  payload,
});
