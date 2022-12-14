import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentRoomCanonicalAliasChanged extends IBaseEventContent {
	alias: string;
	alt_aliases?: string[];
}

export class MatrixEventRoomCanonicalAliasChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomCanonicalAliasChanged;

	public type = MatrixEventType.ROOM_CANONICAL_ALIAS_CHANGED;
}
