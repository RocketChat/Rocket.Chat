import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { ActionTypes } from '../reducer';

type PayloadType ={
  payload: readonly LayoutBlock[];
  changedByEditor?: boolean;
}

export type UpdatePayloadAction = {
  type: ActionTypes.UpdatePayload,
  payload:PayloadType,
};

export const updatePayloadAction = (payload: PayloadType): UpdatePayloadAction => ({
  type: ActionTypes.UpdatePayload,
  payload,
});
