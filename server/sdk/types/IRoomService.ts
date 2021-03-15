import { IRoom } from '../../../definition/IRoom';

interface ISubscriptionExtraData {
	open: boolean;
	ls: Date;
	prid: string;
}

interface ICreateRoomOptions extends Partial<Record<string, string | ISubscriptionExtraData>> {
	nameValidationRegex?: string;
	creator: string;
	subscriptionExtra?: ISubscriptionExtraData;
}

interface ICreateRoomExtraData extends Record<string, string> {
	teamId: string;
}

export interface ICreateRoomParams {
	type: IRoom['t'];
	name: IRoom['name'];
	members?: Array<string>; // member's usernames
	readOnly?: boolean;
	extraData?: Partial<ICreateRoomExtraData>;
	options?: ICreateRoomOptions;
}
export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
	create(uid: string, params: ICreateRoomParams): Promise<IRoom>;
}
