import type { IScheduledMessageService, ScheduledMessageCreateParams } from '@rocket.chat/core-services';
import { ClientSafeError, ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IScheduledMessage, IUser, ScheduledMessageEditableFields } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { Messages, ScheduledMessages, Uploads, Users } from '@rocket.chat/models';

import { deliverScheduledMessage } from './deliverScheduledMessage';
import { deleteHeldFiles } from './heldFiles';
import type { Notify } from './processDueScheduledMessages';
import { processDueScheduledMessages, sendClaimed } from './processDueScheduledMessages';
import { MAX_ITEMS_PER_USER, isScheduledAtInRange } from '../../../lib/scheduledMessageLimits';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { settings } from '../../settings';

const JOB_NAME = 'scheduled-messages';
const WATCHDOG_JOB_NAME = 'scheduled-messages-watchdog';

const logger = new Logger('ScheduledMessages');

const notify: Notify = (uid) => {
	void api.broadcast('notify.scheduledMessage', uid);
};

export class ScheduledMessageService extends ServiceClassInternal implements IScheduledMessageService {
	protected name = 'scheduled-message';

	constructor() {
		super();

		settings.watch<boolean>('Message_Scheduling_Enabled', (enabled) =>
			(enabled ? this.scheduleNext() : this.deleteAll()).catch((err) =>
				logger.error({ msg: 'Could not apply the message scheduling setting', err }),
			),
		);
	}

	override async started(): Promise<void> {
		await cronJobs.add(WATCHDOG_JOB_NAME, '*/5 * * * *', () => this.process());
	}

	async create(uid: IUser['_id'], params: ScheduledMessageCreateParams): Promise<IScheduledMessage> {
		const { user, room } = await this.assertCanSchedule(uid, params.rid);
		if (params.tmid) {
			await this.assertThreadInRoom(params.tmid, params.rid);
		}
		this.assertMessageSize(params.msg);
		this.assertScheduledAtInRange(params.scheduledAt);

		if ((await ScheduledMessages.countByUserId(uid)) >= MAX_ITEMS_PER_USER) {
			throw new ClientSafeError('error-scheduled-messages-limit-reached');
		}
		if (!params.msg && !params.files?.length) {
			throw new ClientSafeError('error-invalid-message');
		}
		const files = await this.holdFiles(uid, params.rid, params.files);

		const { rid, msg, scheduledAt, tmid, tshow } = params;
		const item: Omit<IScheduledMessage, '_id' | '_updatedAt'> = {
			rid,
			msg,
			scheduledAt,
			...(tmid && { tmid, tshow }),
			...(files.length > 0 && { files }),
			u: { _id: user._id, username: user.username, ...(user.name && { name: user.name }) },
			roomName: room.fname || room.name,
			roomType: room.t,
			status: 'pending',
		};
		const { insertedId } = await ScheduledMessages.insertOne(item);
		const scheduledMessage = { ...item, _id: insertedId, _updatedAt: new Date() };

		notify(uid);
		await this.scheduleNext();
		return scheduledMessage;
	}

	async list(
		uid: IUser['_id'],
		{ rid, offset, count }: { rid?: string; offset: number; count: number },
	): Promise<{ scheduledMessages: IScheduledMessage[]; total: number }> {
		await this.assertAllowed(uid);
		const { cursor, totalCount } = ScheduledMessages.findPaginatedByUserId(uid, rid, { skip: offset, limit: count });
		const [scheduledMessages, total] = await Promise.all([cursor.toArray(), totalCount]);
		return { scheduledMessages, total };
	}

	async update(
		uid: IUser['_id'],
		scheduledMessageId: IScheduledMessage['_id'],
		params: ScheduledMessageEditableFields,
	): Promise<IScheduledMessage> {
		const current = await ScheduledMessages.findOneByIdAndUserId(scheduledMessageId, uid);
		if (!current) {
			throw new ClientSafeError('error-scheduled-message-not-found');
		}
		await this.assertCanSchedule(uid, current.rid);
		if (params.msg !== undefined) {
			this.assertMessageSize(params.msg);
		}
		if (params.scheduledAt) {
			this.assertScheduledAtInRange(params.scheduledAt);
		}
		if (!(params.msg ?? current.msg) && !(params.files ?? current.files)?.length) {
			throw new ClientSafeError('error-invalid-message');
		}

		const currentFiles = current.files ?? [];
		const isKept = ({ _id }: { _id: string }) => params.files?.some((file) => file._id === _id) ?? true;
		const added = await this.holdFiles(
			uid,
			current.rid,
			params.files?.filter(({ _id }) => !currentFiles.some((file) => file._id === _id)),
		);
		const files = params.files?.map(
			(file) => added.find(({ _id }) => _id === file._id) ?? { ...currentFiles.find(({ _id }) => _id === file._id), ...file },
		);

		const updated = await ScheduledMessages.updateEditableByIdAndUserId(scheduledMessageId, uid, { ...params, ...(files && { files }) });
		if (!updated) {
			await deleteHeldFiles(added);
			throw new ClientSafeError('error-scheduled-message-not-found');
		}
		await deleteHeldFiles(currentFiles.filter((file) => !isKept(file)));

		notify(uid);
		await this.scheduleNext();
		return updated;
	}

	async delete(uid: IUser['_id'], scheduledMessageId: IScheduledMessage['_id']): Promise<void> {
		await this.assertAllowed(uid);
		const item = await ScheduledMessages.findOneByIdAndUserId(scheduledMessageId, uid);
		const { deletedCount } = await ScheduledMessages.deleteEditableByIdAndUserId(scheduledMessageId, uid);
		if (!deletedCount) {
			throw new ClientSafeError('error-scheduled-message-not-found');
		}
		await deleteHeldFiles(item?.files);

		notify(uid);
		await this.scheduleNext();
	}

	async sendNow(uid: IUser['_id'], scheduledMessageId: IScheduledMessage['_id']): Promise<IMessage> {
		await this.assertAllowed(uid);
		const claimed = await ScheduledMessages.claimByIdAndUserId(scheduledMessageId, uid, new Date());
		if (!claimed) {
			throw new ClientSafeError('error-scheduled-message-not-found');
		}

		try {
			return await sendClaimed(claimed, deliverScheduledMessage, notify);
		} finally {
			await this.scheduleNext();
		}
	}

	async scheduleNext(): Promise<void> {
		await cronJobs.remove(JOB_NAME);
		if (!settings.get<boolean>('Message_Scheduling_Enabled')) {
			return;
		}

		const next = await ScheduledMessages.findNextDueDate();
		if (!next) {
			return;
		}
		await cronJobs.addAtTimestamp(JOB_NAME, next, () => this.process());
	}

	private async deleteAll(): Promise<void> {
		await this.scheduleNext();
		for await (const { _id, u, files } of ScheduledMessages.findAll()) {
			await ScheduledMessages.removeById(_id);
			await deleteHeldFiles(files);
			notify(u._id);
		}
	}

	private async process(): Promise<void> {
		try {
			if (settings.get<boolean>('Message_Scheduling_Enabled')) {
				await processDueScheduledMessages(deliverScheduledMessage, notify);
			}
		} finally {
			await this.scheduleNext();
		}
	}

	private assertEnabled(): void {
		if (!settings.get<boolean>('Message_Scheduling_Enabled')) {
			throw new ClientSafeError('error-message-scheduling-disabled');
		}
	}

	private async assertAllowed(uid: IUser['_id'], rid?: string): Promise<void> {
		this.assertEnabled();
		if (!(await hasPermissionAsync(uid, 'schedule-message', rid))) {
			throw new ClientSafeError('error-not-allowed');
		}
	}

	private assertMessageSize(msg: string): void {
		if (msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			throw new ClientSafeError('error-message-size-exceeded');
		}
	}

	private async holdFiles(uid: IUser['_id'], rid: IRoom['_id'], files: IScheduledMessage['files'] = []) {
		const held: NonNullable<IScheduledMessage['files']> = [];
		for await (const file of files) {
			const upload = await Uploads.findOneByIdAndUserIdAndRoomId(file._id, uid, rid);
			if (!upload) {
				throw new ClientSafeError('invalid-file');
			}
			held.push({ ...file, ...(upload.type && { type: upload.type }) });
		}
		for await (const { _id } of held) {
			await Uploads.confirmTemporaryFile(_id, uid);
		}
		return held;
	}

	private assertScheduledAtInRange(scheduledAt: Date): void {
		if (!isScheduledAtInRange(scheduledAt, new Date())) {
			throw new ClientSafeError('error-scheduled-message-time-out-of-range');
		}
	}

	private async assertThreadInRoom(tmid: IMessage['_id'], rid: IRoom['_id']): Promise<void> {
		const parent = await Messages.findOneById<Pick<IMessage, 'rid'>>(tmid, { projection: { rid: 1 } });
		if (parent?.rid !== rid) {
			throw new ClientSafeError('error-invalid-message');
		}
	}

	private async assertCanSchedule(
		uid: IUser['_id'],
		rid: string,
	): Promise<{ user: Pick<IUser, '_id' | 'username' | 'name'> & { username: string }; room: IRoom }> {
		await this.assertAllowed(uid, rid);

		const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'type'>>(uid, {
			projection: { username: 1, name: 1, type: 1 },
		});
		if (!user?.username) {
			throw new ClientSafeError('error-invalid-user');
		}

		const room = await canSendMessageAsync(rid, { uid: user._id, username: user.username, type: user.type });
		if (room.encrypted && settings.get<boolean>('E2E_Enable') && !settings.get<boolean>('E2E_Allow_Unencrypted_Messages')) {
			throw new ClientSafeError('error-not-allowed');
		}
		return { user: { _id: user._id, username: user.username, name: user.name }, room };
	}
}
