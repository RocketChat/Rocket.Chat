import type { ISubscription, IRole, IUser, IRoom, IMessage, SpotlightUser, AtLeast } from '@rocket.chat/core-typings';
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
	AggregationCursor,
	DeleteOptions,
	CountDocumentsOptions,
	WithId,
	ClientSession,
} from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ISubscriptionsModel extends IBaseModel<ISubscription> {
	getBadgeCount(uid: string): Promise<number>;

	findOneByRoomIdAndUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		uid: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findByUserIdAndRoomIds<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		roomIds: Array<string>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByRoomId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findUnarchivedByRoomId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByRoomIdAndNotUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	countByRoomIdAndUserId(rid: string, uid: string | undefined, includeInvitations?: boolean): Promise<number>;

	countUnarchivedByRoomId(rid: string): Promise<number>;

	countUnarchivedByRoomIdAndNotUserId(rid: string, uid: string): Promise<number>;

	isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<boolean>;

	setAsReadByRoomIdAndUserId(
		rid: string,
		uid: string,
		readThreads?: boolean,
		alert?: boolean,
		options?: FindOptions<ISubscription>,
	): ReturnType<IBaseModel<ISubscription>['updateOne']>;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateResult>;

	findUsersInRoles<P extends Document = IUser, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options?: O,
	): Promise<FindCursor<DocumentWithProjection<P, O>>>;

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id'], rid?: IRoom['_id']): Promise<boolean>;

	findByRolesAndRoomId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		{ roles, rid }: { roles: string; rid?: string },
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByUserIdAndTypes<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		types: ISubscription['t'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findOpenByVisitorIds<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitorIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByRoomIdAndNotAlertOrOpenExcludingUserIds<
		T extends Document = ISubscription,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		filter: {
			roomId: ISubscription['rid'];
			uidsExclude?: ISubscription['u']['_id'][];
			uidsInclude?: ISubscription['u']['_id'][];
			onlyRead: boolean;
		},
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	removeByRoomId(roomId: ISubscription['rid'], options?: DeleteOptions & { onTrash: (doc: ISubscription) => void }): Promise<DeleteResult>;

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

	updateNameAndFnameByVisitorIds(visitorIds: string[], name: string): Promise<UpdateResult | Document>;

	setGroupE2EKey(_id: string, key: string): Promise<UpdateResult>;

	setGroupE2EKeyAndOldRoomKeys(_id: string, key: string, oldRoomKeys: ISubscription['oldRoomKeys']): Promise<UpdateResult>;

	setGroupE2ESuggestedKey(uid: string, rid: string, key: string): Promise<null | WithId<ISubscription>>;

	setGroupE2ESuggestedKeyAndOldRoomKeys(
		uid: string,
		rid: string,
		key: string,
		suggestedOldRoomKeys: ISubscription['suggestedOldRoomKeys'],
	): Promise<null | WithId<ISubscription>>;

	unsetGroupE2ESuggestedKeyAndOldRoomKeys(_id: string): Promise<UpdateResult | Document>;

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
	updateDraftByRoomIdAndUserId(
		rid: IRoom['_id'],
		uid: IUser['_id'],
		draft: string | undefined,
		tmid?: IMessage['_id'],
	): Promise<null | WithId<ISubscription>>;

	updateMuteGroupMentions(_id: string, muteGroupMentions: boolean): Promise<UpdateResult>;
	changeDepartmentByRoomId(rid: string, department: string): Promise<UpdateResult>;

	getAutoTranslateLanguagesByRoomAndNotUser(rid: string, userId: string): Promise<(string | undefined)[]>;

	findByRidWithoutE2EKey<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findUsersWithPublicE2EKeyByRids(
		rids: IRoom['_id'][],
		excludeUserId: IUser['_id'],
		usersLimit?: number,
	): AggregationCursor<{ rid: IRoom['_id']; users: { _id: IUser['_id']; public_key: string }[] }>;
	findByUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	updateAutoTranslateById(_id: string, autoTranslate: boolean): Promise<UpdateResult>;

	setAutoTranslateByUserId(userId: IUser['_id'], language: string | null): Promise<UpdateResult | Document>;
	findByAutoTranslateAndUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: ISubscription['u']['_id'],
		autoTranslate?: ISubscription['autoTranslate'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByUserIdAndRoomType<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: ISubscription['u']['_id'],
		type: ISubscription['t'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNameAndRoomType<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		filter: Partial<Pick<ISubscription, 'name' | 't'>>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	disableAutoTranslateByRoomId(roomId: IRoom['_id']): Promise<UpdateResult | Document>;

	findByUserIdWithoutE2E<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	resetUserE2EKey(userId: string): Promise<UpdateResult | Document>;

	findOneByRoomIdAndUsername<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		username: string,
		options: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findByTypeAndUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: ISubscription['t'],
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByType<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		types: ISubscription['t'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByUserIdAndRoles<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		roles: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	getLastSeen(options?: FindOptions<ISubscription>): Promise<Date | undefined>;
	findByRoomWithUserHighlights<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByUserIdAndType<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		type: ISubscription['t'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByUserIdExceptType<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		typeException: ISubscription['t'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByRoomIdAndRoles<P extends Document = ISubscription, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		roomId: string,
		roles: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	findByRoomIdAndUserIds<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: ISubscription['rid'],
		userIds: ISubscription['u']['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	getMinimumLastSeenByRoomId(rid: string): Promise<Pick<ISubscription, '_id' | 'ls'> | null>;

	setAsUnreadByRoomIdAndUserId(roomId: string, userId: string, firstMessageUnreadTimestamp: Date): Promise<UpdateResult>;

	archiveByRoomId(roomId: string): Promise<UpdateResult | Document>;
	findArchivedByRoomId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findArchivedByUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	unarchiveByIds(ids: string[]): Promise<UpdateResult | Document>;
	updateNameAndAlertByRoomId(roomId: string, name: string, fname: string): Promise<UpdateResult | Document>;
	findByRoomIdWhenUsernameExists<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	setCustomFieldsDirectMessagesByUserId(userId: string, fields: Record<string, any>): Promise<UpdateResult | Document>;
	setFavoriteByRoomIdAndUserId(roomId: string, userId: string, favorite?: boolean): Promise<UpdateResult>;
	setCategoryByRoomIdsAndUserId(roomIds: string[], userId: string, category: string | null): Promise<UpdateResult | Document>;
	hideByRoomIdAndUserId(roomId: string, userId: string): Promise<UpdateResult>;
	findByRoomIdWhenUserIdExists<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	updateNameAndFnameById(_id: string, name: string, fname: string, options?: { session?: ClientSession }): Promise<UpdateResult | Document>;
	setUserUsernameByUserId(userId: string, username: string): Promise<UpdateResult | Document>;
	updateFnameByRoomId(rid: string, fname: string): Promise<UpdateResult | Document>;
	updateDisplayNameByRoomId(roomId: string, fname: string): Promise<UpdateResult | Document>;

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

	setAlertForRoomIdAndUserIds(roomId: ISubscription['rid'], uids: ISubscription['u']['_id'][]): Promise<UpdateResult | Document>;
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
	setArchivedByUserId(userId: string, archived: boolean): Promise<UpdateResult | Document>;
	setArchivedForDMsWithUsername(username: string, archived: boolean): Promise<UpdateResult | Document>;
	updateUserHighlights(userId: string, userHighlights: any): Promise<UpdateResult | Document>;
	updateNotificationUserPreferences(
		userId: string,
		userPref: string | number | boolean,
		notificationField: keyof ISubscription,
		notificationOriginField: keyof ISubscription,
	): Promise<UpdateResult | Document>;
	findByUserPreferences<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		notificationOriginField: keyof ISubscription,
		originFieldNotEqualValue: 'user' | 'subscription',
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	clearNotificationUserPreferences(
		userId: string,
		notificationField: string,
		notificationOriginField: string,
	): Promise<UpdateResult | Document>;
	removeByUserId(userId: string): Promise<number>;
	createWithRoomAndUser(room: IRoom, user: IUser, extraData?: Partial<ISubscription>): Promise<InsertOneResult<ISubscription>>;
	createWithRoomAndManyUsers(
		room: IRoom,
		users: { user: AtLeast<IUser, '_id' | 'username' | 'name' | 'settings'>; extraData: Record<string, any> }[],
	): Promise<InsertManyResult<ISubscription>>;
	removeByRoomIdAndUserId(roomId: string, userId: string): Promise<ISubscription | null>;
	removeInvitedByRoomIdAndUserId(roomId: string, userId: string): Promise<ISubscription | null>;

	removeByRoomIds(rids: string[], options?: { onTrash: (doc: ISubscription) => void }): Promise<DeleteResult>;

	addUnreadThreadByRoomIdAndUserIds(
		rid: string,
		users: string[],
		tmid: string,
		data: { groupMention?: boolean; userMention?: boolean },
	): Promise<UpdateResult | Document | void>;
	removeUnreadThreadByRoomIdAndUserId(rid: string, userId: string, tmid: string, clearAlert?: boolean): Promise<UpdateResult>;

	removeUnreadThreadsByRoomId(rid: string, tunread: string[]): Promise<UpdateResult | Document>;
	findUnreadThreadsByRoomId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: ISubscription['rid'],
		tunread: ISubscription['tunread'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	countByRoomIdAndRoles(roomId: string, roles: string[]): Promise<number>;
	countByRoomId(roomId: string, options?: CountDocumentsOptions): Promise<number>;
	countByUserIdExceptType(userId: string, typeException: ISubscription['t']): Promise<number>;
	openByRoomIdAndUserId(roomId: string, userId: string): Promise<UpdateResult>;
	countByRoomIdWhenUsernameExists(rid: string): Promise<number>;
	setE2EKeyByUserIdAndRoomId(userId: string, rid: string, key: string): Promise<null | WithId<ISubscription>>;
	countUsersInRoles(roles: IRole['_id'][], rid: IRoom['_id'] | undefined): Promise<number>;
	findUserFederatedRoomIds(userId: IUser['_id']): AggregationCursor<{ _id: IRoom['_id']; externalRoomId: string }>;
	findInvitedSubscription(roomId: ISubscription['rid'], userId: ISubscription['u']['_id']): Promise<ISubscription | null>;
	acceptInvitationById(subscriptionId: ISubscription['_id']): Promise<UpdateResult>;
	findOneBannedSubscription(roomId: ISubscription['rid'], userId: ISubscription['u']['_id']): Promise<ISubscription | null>;
	banByRoomIdAndUserId(roomId: string, userId: string): Promise<UpdateResult>;
	unbanToInvitedById(subId: string, inviter: Required<Pick<IUser, '_id' | 'username'>> & Pick<IUser, 'name'>): Promise<UpdateResult>;
	setAbacLastTimeCheckedByUserIdAndRoomId(userId: string, roomId: string, time: Date): Promise<UpdateResult>;
	findJoinedByUserId<T extends Document = ISubscription, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: ISubscription['u']['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
}
