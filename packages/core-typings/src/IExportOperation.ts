import type { FileProp } from './IMessage/MessageAttachment/Files/FileProp';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';
import type { RoomType } from './RoomType';

export interface IExportOperation extends IRocketChatRecord {
	roomList?: (
		| {
				roomId: string;
				roomName: string;
				userId: string | undefined;
				exportedCount: number;
				status: 'pending' | 'exporting'| 'completed';
				type: RoomType;
				targetFile: string;
		  }
		| Record<string, never>
	)[];
	status: 'pending' | 'preparing' | 'exporting-rooms' | 'exporting' | 'downloading' | 'compressing' | 'uploading' | 'completed' | 'skipped' | 'failed';
	failReason?: string;
	fileList: FileProp[];
	generatedFile?: string;
    generatedFileName?: string;
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
