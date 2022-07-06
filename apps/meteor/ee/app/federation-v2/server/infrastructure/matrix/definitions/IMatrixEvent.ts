import { EventContentEE } from './IMatrixEventContent';
import { MatrixEventTypeEE } from './MatrixEventType';

export interface IMatrixEventEE<T extends MatrixEventTypeEE> {
	age: number;
	content: EventContentEE[T];
	invite_room_state?: IMatrixEventEE<MatrixEventTypeEE>[];
	event_id: string;
	origin_server_ts: number;
	room_id: string;
	sender: string;
	state_key: string;
	type: T;
	unsigned: { age: number; invite_room_state: Record<string, any>[] };
	user_id: string;
}
