import type { docType } from '../initialState';

type action = {
  type: string,
  payload: docType,
};

export const docAction = (payload: docType): action => ({
  type: 'doc',
  payload,
});
