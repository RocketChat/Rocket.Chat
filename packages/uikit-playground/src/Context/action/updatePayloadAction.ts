import type { docType } from '../initialState';

type action = {
  type: string,
  payload: Partial<docType>,
};

export const updatePayloadAction = (payload: Partial<docType>): action => ({
  type: 'updatePayload',
  payload,
});
