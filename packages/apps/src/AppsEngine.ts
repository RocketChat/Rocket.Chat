export type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
export type {
	IDepartment as IAppsDepartment,
	ILivechatMessage as IAppsLivechatMessage,
	ILivechatRoom as IAppsLivechatRoom,
	IVisitor as IAppsVisitor,
	IVisitorEmail as IAppsVisitorEmail,
	IVisitorPhone as IAppsVisitorPhone,
} from '@rocket.chat/apps-engine/definition/livechat';
export type { IMessage as IAppsMessage } from '@rocket.chat/apps-engine/definition/messages';
export type { IUser as IAppsUser } from '@rocket.chat/apps-engine/definition/users';
export type { IRole as IAppsRole } from '@rocket.chat/apps-engine/definition/roles';
export type { IRoom as IAppsRoom } from '@rocket.chat/apps-engine/definition/rooms';
export type { ISetting as IAppsSetting } from '@rocket.chat/apps-engine/definition/settings';
export type { IUpload as IAppsUpload } from '@rocket.chat/apps-engine/definition/uploads';
export type {
	IVideoConference as IAppsVideoConference,
	VideoConference as AppsVideoConference,
} from '@rocket.chat/apps-engine/definition/videoConferences';
export { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
