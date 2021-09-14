export interface IRocketChatRecord {
	_id: string;
	_updatedAt: Date;
}


export const isIRocketChatRecord = (data: any): data is IRocketChatRecord => data && data._id;
