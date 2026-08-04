import type { SurfaceOptions } from '../../Components/Preview/Display/Surface/constant';
import type { ILayoutBlock } from '../initialState';
import { ActionTypes } from '../reducer';

type PayloadType = {
	blocks: ILayoutBlock[];
	changedByEditor?: boolean;
	surface?: SurfaceOptions;
};

export type UpdatePayloadAction = {
	type: ActionTypes.UpdatePayload;
	payload: PayloadType;
};

export const updatePayloadAction = (payload: PayloadType): UpdatePayloadAction => ({
	type: ActionTypes.UpdatePayload,
	payload,
});
