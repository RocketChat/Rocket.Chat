import type { docType } from '../initialState';

export type DocAction = {
  type: 'doc';
  payload: docType;
};

export const docAction = (payload: docType): DocAction => ({
  type: 'doc',
  payload,
});
