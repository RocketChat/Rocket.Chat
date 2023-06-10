import type { userType } from '../initialState';

type action = {
  type: string,
  payload: userType,
};

export const userAction = (payload: userType): action => ({
  type: 'user',
  payload,
});
