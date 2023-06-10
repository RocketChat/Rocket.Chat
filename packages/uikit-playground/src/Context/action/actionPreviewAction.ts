import type { actionPreviewType } from '../initialState';

type action = {
  type: string,
  payload: actionPreviewType,
};

export const actionPreviewAction = (payload: actionPreviewType): action => ({
  type: 'actionPreview',
  payload,
});
