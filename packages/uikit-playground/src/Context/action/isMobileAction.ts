import { ActionTypes } from "../reducer";

export type IsMobileAction = {
  type: ActionTypes.IsMobile,
  payload: boolean,
};

export const isMobileAction = (payload: boolean): IsMobileAction => ({
  type: ActionTypes.IsMobile,
  payload,
});
