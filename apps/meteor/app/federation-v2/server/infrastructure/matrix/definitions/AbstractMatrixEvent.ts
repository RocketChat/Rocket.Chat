export abstract class AbstractMatrixEvent {
	public age: number;

	public invite_room_state?: AbstractMatrixEvent[];

	public event_id: string;

	public origin_server_ts: number;

	public room_id: string;

	public sender: string;

	public state_key: string;

	public unsigned: { age: number; invite_room_state: AbstractMatrixEvent[] };

	public user_id: string;

	public abstract content: IBaseEventContent;

	public abstract type: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBaseEventContent {}
