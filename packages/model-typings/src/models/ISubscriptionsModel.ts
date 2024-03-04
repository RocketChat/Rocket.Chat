import type { ISubscription, IRole, IUser, IRoom, RoomType, SpotlightUser, AtLeast } from '@rocket.chat/core-typings';
import type {
	FindOptions,
	FindCursor,
	UpdateResult,
	DeleteResult,
	Document,
	AggregateOptions,
	Filter,
	InsertOneResult,
	InsertManyResult,
} from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ISubscriptionsModel extends IBaseModel<ISubscription> {
	getBadgeCount(uid: string): Promise<number>;

	findOneByRoomIdAndUserId(rid: string, uid: string, options?: FindOptions<ISubscription>): Promise<ISubscription | null>;

	findByUserIdAndRoomIds(userId: string, roomIds: Array<string>, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByRoomId(roomId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findUnarchivedByRoomId(roomId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByLivechatRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	countByRoomIdAndUserId(rid: string, uid: string | undefined): Promise<number>;

	countUnarchivedByRoomId(rid: string): Promise<number>;

	isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<boolean>;

	setAsReadByRoomIdAndUserId(
		rid: string,
		uid: string,
		readThreads?: boolean,
		alert?: boolean,
		options?: FindOptions<ISubscription>,
	): ReturnType<IBaseModel<ISubscription>['update']>;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateResult>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined): Promise<FindCursor<IUser>>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

	findUsersInRoles<P extends Document = IUser>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>>;

	findUsersInRoles<P extends Document = IUser>(
		roles: IRole['_id'][],
		rid: IRoom['_id'] | undefined,
		options?: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>>;

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id'], rid?: IRoom['_id']): Promise<boolean>;

	updateAllRoomTypesByRoomId(roomId: IRoom['_id'], roomType: RoomType): Promise<void>;

	updateAllRoomNamesByRoomId(roomId: IRoom['_id'], name: string, fname: string): Promise<void>;

	findByRolesAndRoomId({ roles, rid }: { roles: string; rid?: string }, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByUserIdAndTypes(userId: string, types: ISubscription['t'][], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	removeByRoomId(roomId: string): Promise<number>;

	findConnectedUsersExcept(
		userId: string,
		searchTerm: string,
		exceptions: string[],
		searchFields: string[],
		extraConditions: Filter<IUser>,
		limit: number,
		roomType?: ISubscription['t'],
		{ startsWith, endsWith }?: { startsWith?: string | false; endsWith?: string | false },
		options?: AggregateOptions,
	): Promise<SpotlightUser[]>;

	incUnreadForRoomIdExcludingUserIds(roomId: IRoom['_id'], userIds: IUser['_id'][], inc: number): Promise<UpdateResult | Document>;

	setAlertForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document>;

	setOpenForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document>;

	updateNameAndFnameByRoomId(roomId: string, name: string, fname: string): Promise<UpdateResult | Document>;

	setGroupE2EKey(_id: string, key: string): Promise<ISubscription | null>;

	setGroupE2ESuggestedKey(_id: string, key: string): Promise<UpdateResult | Document>;

	unsetGroupE2ESuggestedKey(_id: string): Promise<UpdateResult | Document>;

	setOnHoldByRoomId(roomId: string): Promise<UpdateResult>;
	unsetOnHoldByRoomId(roomId: string): Promise<UpdateResult>;

	updateUnreadAlertById(_id: string, unreadAlert: ISubscription['unreadAlert']): Promise<UpdateResult>;
	updateNotificationsPrefById(
		_id: string,
		notificationPref: { value: number; origin: string } | null,
		notificationField: keyof ISubscription,
		notificationPrefOrigin: keyof ISubscription,
	): Promise<UpdateResult>;
	updateHideMentionStatusById(_id: string, hideMentionStatus: boolean): Promise<UpdateResult>;
	updateDisableNotificationsById(_id: string, disableNotifications: boolean): Promise<UpdateResult>;
	clearAudioNotificationValueById(_id: string): Promise<UpdateResult>;
	updateHideUnreadStatusById(_id: string, hideUnreadStatus: boolean): Promise<UpdateResult>;
	updateAudioNotificationValueById(_id: string, audioNotificationValue: string): Promise<UpdateResult>;
	updateAutoTranslateLanguageById(_id: string, autoTranslateLanguage: string): Promise<UpdateResult>;

	removeByVisitorToken(token: string): Promise<DeleteResult>;

	updateMuteGroupMentions(_id: string, muteGroupMentions: boolean): Promise<UpdateResult>;
	findByRoomIds(roomIds: string[]): FindCursor<ISubscription>;
	changeDepartmentByRoomId(rid: string, department: string): Promise<UpdateResult>;

	roleBaseQuery(userId: string, scope?: string): Filter<ISubscription> | void;

	getAutoTranslateLanguagesByRoomAndNotUser(rid: string, userId: string): Promise<(string | undefined)[]>;

	findByRidWithoutE2EKey(rid: string, options: FindOptions<ISubscription>): FindCursor<ISubscription>;
	findByUserId(userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	cachedFindByUserId(userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	updateAutoTranslateById(_id: string, autoTranslate: boolean): Promise<UpdateResult>;
	updateAllAutoTranslateLanguagesByUserId(userId: IUser['_id'], language: string): Promise<UpdateResult | Document>;
	disableAutoTranslateByRoomId(roomId: IRoom['_id']): Promise<UpdateResult | Document>;
	findAlwaysNotifyDesktopUsersByRoomId(roomId: string): FindCursor<ISubscription>;

	findOneByRoomNameAndUserId(roomName: string, userId: string): Promise<ISubscription | null>;
	findDontNotifyDesktopUsersByRoomId(roomId: string): FindCursor<ISubscription>;

	findByUserIdWithoutE2E(userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	resetUserE2EKey(userId: string): Promise<UpdateResult | Document>;
	findAlwaysNotifyMobileUsersByRoomId(roomId: string): FindCursor<ISubscription>;

	findWithSendEmailByRoomId(roomId: string): FindCursor<ISubscription>;
	findOneByRoomIdAndUsername(roomId: string, username: string, options: FindOptions<ISubscription>): Promise<ISubscription | null>;
	findDontNotifyMobileUsersByRoomId(roomId: string): FindCursor<ISubscription>;

	findByTypeAndUserId(type: ISubscription['t'], userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByType(types: ISubscription['t'][], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByUserIdAndRoles(userId: string, roles: string[], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	getLastSeen(options?: FindOptions<ISubscription>): Promise<Date | undefined>;
	findByRoomWithUserHighlights(roomId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	findByUserIdAndType(userId: string, type: ISubscription['t'], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	findByUserIdExceptType(
		userId: string,
		typeException: ISubscription['t'],
		options?: FindOptions<ISubscription>,
	): FindCursor<ISubscription>;
	findByRoomIdAndRoles(roomId: string, roles: string[], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	findByRoomIdAndUserIds(roomId: string, userIds: string[], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	findByUserIdUpdatedAfter(userId: string, updatedAt: Date, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByRoomIdAndUserIdsOrAllMessages(roomId: string, userIds: string[]): FindCursor<ISubscription>;

	getMinimumLastSeenByRoomId(rid: string): Promise<ISubscription | null>;

	setAsUnreadByRoomIdAndUserId(roomId: string, userId: string, firstMessageUnreadTimestamp: Date): Promise<UpdateResult>;
	findUnreadByUserId(userId: string): FindCursor<ISubscription>;

	archiveByRoomId(roomId: string): Promise<UpdateResult | Document>;
	unarchiveByRoomId(roomId: string): Promise<UpdateResult | Document>;
	updateNameAndAlertByRoomId(roomId: string, name: string, fname: string): Promise<UpdateResult | Document>;
	findByRoomIdWhenUsernameExists(rid: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	setCustomFieldsDirectMessagesByUserId(userId: string, fields: Record<string, any>): Promise<UpdateResult | Document>;
	setFavoriteByRoomIdAndUserId(roomId: string, userId: string, favorite?: boolean): Promise<UpdateResult>;
	hideByRoomIdAndUserId(roomId: string, userId: string): Promise<UpdateResult>;
	findByRoomIdWhenUserIdExists(rid: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;
	updateNameAndFnameById(_id: string, name: string, fname: string): Promise<UpdateResult | Document>;
	setUserUsernameByUserId(userId: string, username: string): Promise<UpdateResult | Document>;
	updateFnameByRoomId(rid: string, fname: string): Promise<UpdateResult | Document>;
	updateDisplayNameByRoomId(roomId: string, fname: string): Promise<UpdateResult | Document>;
	setNameForDirectRoomsWithOldName(oldName: string, name: string): Promise<UpdateResult | Document>;

	updateDirectNameAndFnameByName(name: string, newName?: string, newFname?: string): Promise<UpdateResult | Document>;

	incGroupMentionsAndUnreadForRoomIdExcludingUserId(
		roomId: IRoom['_id'],
		userId: IUser['_id'],
		incGroup?: number,
		incUnread?: number,
	): Promise<UpdateResult | Document>;
	unsetBlockedByRoomId(rid: string, blocked: string, blocker: string): Promise<UpdateResult[]>;
	setLastReplyForRoomIdAndUserIds(roomId: IRoom['_id'], uids: IUser['_id'][], lr: Date): Promise<UpdateResult | Document>;
	updateCustomFieldsByRoomId(rid: string, cfields: Record<string, any>): Promise<UpdateResult | Document>;
	setOpenForRoomIdAndUserIds(roomId: string, uids: string[]): Promise<UpdateResult | Document>;

	setAlertForRoomIdAndUserIds(roomId: string, uids: string[]): Promise<UpdateResult | Document>;
	updateTypeByRoomId(roomId: string, type: ISubscription['t']): Promise<UpdateResult | Document>;
	setBlockedByRoomId(rid: string, blocked: string, blocker: string): Promise<UpdateResult[]>;
	incUserMentionsAndUnreadForRoomIdAndUserIds(
		roomId: IRoom['_id'],
		userIds: IUser['_id'][],
		incUser?: number,
		incUnread?: number,
	): Promise<UpdateResult | Document>;

	ignoreUser(data: { _id: string; ignoredUser: string; ignore?: boolean }): Promise<UpdateResult>;

	addRoleById(_id: string, role: string): Promise<UpdateResult>;

	removeRoleById(_id: string, role: string): Promise<UpdateResult>;
	updateDirectFNameByName(name: string, fname: string): Promise<UpdateResult | Document>;
	setArchivedByUsername(username: string, archived: boolean): Promise<UpdateResult | Document>;
	updateUserHighlights(userId: string, userHighlights: any): Promise<UpdateResult | Document>;
	updateNotificationUserPreferences(
		userId: string,
		userPref: string | number | boolean,
		notificationField: keyof ISubscription,
		notificationOriginField: keyof ISubscription,
	): Promise<UpdateResult | Document>;
	clearNotificationUserPreferences(
		userId: string,
		notificationField: string,
		notificationOriginField: string,
	): Promise<UpdateResult | Document>;
	removeByUserId(userId: string): Promise<number>;
	createWithRoomAndUser(room: IRoom, user: IUser, extraData?: Record<string, any>): Promise<InsertOneResult<ISubscription>>;
	createWithRoomAndManyUsers(
		room: IRoom,
		users: { user: AtLeast<IUser, '_id' | 'username' | 'name' | 'settings'>; extraData: Record<string, any> }[],
	): Promise<InsertManyResult<ISubscription>>;
	removeByRoomIdsAndUserId(rids: string[], userId: string): Promise<number>;
	removeByRoomIdAndUserId(roomId: string, userId: string): Promise<number>;

	removeByRoomIds(rids: string[]): Promise<DeleteResult>;

	addUnreadThreadByRoomIdAndUserIds(
		rid: string,
		users: string[],
		tmid: string,
		data: { groupMention?: boolean; userMention?: boolean },
	): Promise<UpdateResult | Document | void>;
	removeUnreadThreadByRoomIdAndUserId(rid: string, userId: string, tmid: string, clearAlert?: boolean): Promise<UpdateResult>;

	removeUnreadThreadsByRoomId(rid: string, tunread: string[]): Promise<UpdateResult | Document>;
	countByRoomIdAndRoles(roomId: string, roles: string[]): Promise<number>;
	countByRoomId(roomId: string): Promise<number>;
	countByUserId(userId: string): Promise<number>;
	openByRoomIdAndUserId(roomId: string, userId: string): Promise<UpdateResult>;
	countByRoomIdAndNotUserId(rid: string, uid: string): Promise<number>;
	countByRoomIdWhenUsernameExists(rid: string): Promise<number>;
}
