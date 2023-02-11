import type { RoomType } from './RoomType';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { FileProp } from './IMessage/MessageAttachment/Files/FileProp';
import type { IUser } from './IUser';

export interface IExportOperation extends IRocketChatRecord {
	roomList?: (
		| {
				roomId: string;
				roomName: string;
				userId: string | undefined;
				exportedCount: number;
				status: string;
				type: RoomType;
				targetFile: string;
		  }
		| Record<string, never>
	)[];
	status: string;
	fileList: FileProp[];
	generatedFile?: string;
	fileId: string;
	userNameTable: Record<string, string>;
	userData: IUser;
	generatedUserFile: boolean;
	generatedAvatar: boolean;
	exportPath: string;
	assetsPath: string;
	createdAt: Date;
	fullExport: boolean;
	userId: IUser['_id'];
}
