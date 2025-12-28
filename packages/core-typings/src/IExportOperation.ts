import type { FileProp } from './IMessage/MessageAttachment/Files/FileProp';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUpload } from './IUpload';
import type { IUser } from './IUser';
import type { RoomType } from './RoomType';

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
	fileId: IUpload['_id'];
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
