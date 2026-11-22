import type { IScheduledMessageService, ScheduledMessageCreateParams } from '@rocket.chat/core-services';
import { ClientSafeError, ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IScheduledMessage, IUser, ScheduledMessageEditableFields } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { Messages, ScheduledMessages, Uploads, Users } from '@rocket.chat/models';

import { deliverScheduledMessage } from './deliverScheduledMessage';
import type { Notify } from './processDueScheduledMessages';
import { processDueScheduledMessages, sendClaimed } from './processDueScheduledMessages';
import { MAX_ITEMS_PER_USER, isScheduledAtInRange } from '../../../lib/scheduledMessageLimits';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { FileUpload } from '../../lib/media/file-upload';
import { settings } from '../../settings';

const JOB_NAME = 'scheduled-messages';
const WATCHDOG_JOB_NAME = 'scheduled-messages-watchdog';

const logger = new Logger('ScheduledMessages');

const notify: Notify = (uid) => {
	void api.broadcast('notify.scheduledMessage', uid);
};

export class ScheduledMessageService extends ServiceClassInternal implements IScheduledMessageService {
	protected name = 'scheduled-message';

	private rescheduling: Promise<void> = Promise.resolve();

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
		const encrypted = params.t === 'e2e';
		await this.assertCanSchedule(uid, params.rid, encrypted);
		this.assertContent(encrypted, params);
		if (params.tmid) {
			await this.assertThreadInRoom(params.tmid, params.rid);
		}
		this.assertMessageSize(params.msg);
		params.files?.forEach(({ description = '' }) => this.assertMessageSize(description));
		this.assertScheduledAtInRange(params.scheduledAt);

		if ((await ScheduledMessages.countByUserId(uid)) >= MAX_ITEMS_PER_USER) {
			throw new ClientSafeError('error-scheduled-messages-limit-reached');
		}
		const files = await this.findFilesToHold(uid, params.rid, params.files);

		const { rid, msg, scheduledAt, tmid, tshow, content, e2eMentions } = params;
		const item: Omit<IScheduledMessage, '_id' | '_updatedAt'> = {
			rid,
			msg,
			scheduledAt,
			...(tmid && { tmid, tshow }),
			...(files.length > 0 && { files }),
			...(encrypted && { t: 'e2e' as const, content, ...(e2eMentions && { e2eMentions }) }),
			u: { _id: uid },
			status: 'pending',
		};
		const { insertedId } = await ScheduledMessages.insertOne(item);
		await this.holdFiles(uid, files);
		const scheduledMessage = { ...item, _id: insertedId, _updatedAt: new Date() };

		notify(uid);
		await this.scheduleNext();
		return scheduledMessage;
	}

	async list(
		uid: IUser['_id'],
		{ offset, count }: { offset: number; count: number },
	): Promise<{ scheduledMessages: IScheduledMessage[]; total: number }> {
		await this.assertAllowed(uid);
		const { cursor, totalCount } = ScheduledMessages.findPaginatedByUserId(uid, { skip: offset, limit: count });
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
		const encrypted = current.t === 'e2e';
		await this.assertCanSchedule(uid, current.rid, encrypted);
		this.assertContent(encrypted, {
			msg: params.msg ?? current.msg,
			content: params.content ?? current.content,
			files: params.files ?? current.files,
		});
		if (params.msg !== undefined) {
			this.assertMessageSize(params.msg);
		}
		if (params.scheduledAt) {
			this.assertScheduledAtInRange(params.scheduledAt);
		}

		const currentFiles = current.files ?? [];
		const isKept = ({ _id }: { _id: string }) => params.files?.some((file) => file._id === _id) ?? true;
		const added = await this.findFilesToHold(
			uid,
			current.rid,
			params.files?.filter(({ _id }) => !currentFiles.some((file) => file._id === _id)),
		);
		const files = params.files?.map(
			(file) => added.find(({ _id }) => _id === file._id) ?? { ...currentFiles.find(({ _id }) => _id === file._id), ...file },
		);
		files?.forEach(({ description = '' }) => this.assertMessageSize(description));

		const updated = await ScheduledMessages.updateEditableByIdAndUserId(scheduledMessageId, uid, {
			...params,
			...(files && { files }),
			...(params.scheduledAt && { status: 'pending' as const }),
		});
		if (!updated) {
			throw new ClientSafeError('error-scheduled-message-not-found');
		}
		await this.holdFiles(uid, added);
		await this.deleteHeldFiles(currentFiles.filter((file) => !isKept(file)));

		notify(uid);
		await this.scheduleNext();
		return updated;
	}

	async delete(uid: IUser['_id'], scheduledMessageId: IScheduledMessage['_id']): Promise<void> {
		await this.assertAllowed(uid);
		const deleted = await ScheduledMessages.deleteEditableByIdAndUserId(scheduledMessageId, uid);
		if (!deleted) {
			throw new ClientSafeError('error-scheduled-message-not-found');
		}
		await this.deleteHeldFiles(deleted.files);

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

	async deleteByRoomId(rid: IRoom['_id']): Promise<void> {
		await this.deleteItems(ScheduledMessages.findByRoomId(rid));
	}

	async deleteByUserId(uid: IUser['_id']): Promise<void> {
		await this.deleteItems(ScheduledMessages.findByUserId(uid));
	}

	scheduleNext(): Promise<void> {
		this.rescheduling = this.rescheduling.catch(() => undefined).then(() => this.replaceJob());
		return this.rescheduling;
	}

	private async replaceJob(): Promise<void> {
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
		await this.deleteItems(ScheduledMessages.findAll());
	}

	private async deleteItems(items: AsyncIterable<IScheduledMessage>): Promise<void> {
		const authors = new Set<IUser['_id']>();
		for await (const { _id, u, files } of items) {
			await ScheduledMessages.removeById(_id);
			await this.deleteHeldFiles(files);
			authors.add(u._id);
		}
		authors.forEach((uid) => notify(uid));
	}

	private async deleteHeldFiles(files: IScheduledMessage['files']): Promise<void> {
		for (const { _id } of files ?? []) {
			await FileUpload.getStore('Uploads')
				.deleteById(_id)
				.catch((err) => logger.error({ msg: 'Could not delete a held file', fileId: _id, err }));
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

	private async assertAllowed(uid: IUser['_id'], rid?: string): Promise<void> {
		if (!settings.get<boolean>('Message_Scheduling_Enabled')) {
			throw new ClientSafeError('error-message-scheduling-disabled');
		}
		if (!(await hasPermissionAsync(uid, 'schedule-message', rid))) {
			throw new ClientSafeError('error-not-allowed');
		}
	}

	private assertContent(encrypted: boolean, { msg, content, files }: ScheduledMessageEditableFields): void {
		const valid = encrypted ? !msg && !files?.length && !!content : !content && (!!msg || !!files?.length);
		if (!valid) {
			throw new ClientSafeError('error-invalid-message');
		}
	}

	private assertMessageSize(msg: string): void {
		if (msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			throw new ClientSafeError('error-message-size-exceeded');
		}
	}

	private async findFilesToHold(uid: IUser['_id'], rid: IRoom['_id'], files: IScheduledMessage['files'] = []) {
		const held: NonNullable<IScheduledMessage['files']> = [];
		for (const file of files) {
			const upload = await Uploads.findOneByIdAndUserIdAndRoomId(file._id, uid, rid);
			if (!upload?.expiresAt) {
				throw new ClientSafeError('error-scheduled-message-file-missing');
			}
			held.push({ ...file, ...(upload.type && { type: upload.type }) });
		}
		return held;
	}

	private async holdFiles(uid: IUser['_id'], files: NonNullable<IScheduledMessage['files']>): Promise<void> {
		for (const { _id } of files) {
			await Uploads.confirmTemporaryFile(_id, uid);
		}
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

	private async assertCanSchedule(uid: IUser['_id'], rid: string, encrypted: boolean): Promise<void> {
		await this.assertAllowed(uid, rid);

		const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'type'>>(uid, {
			projection: { username: 1, type: 1 },
		});
		if (!user?.username) {
			throw new ClientSafeError('error-invalid-user');
		}

		const room = await canSendMessageAsync(rid, { uid: user._id, username: user.username, type: user.type });
		if (!encrypted && room.encrypted && settings.get<boolean>('E2E_Enable') && !settings.get<boolean>('E2E_Allow_Unencrypted_Messages')) {
			throw new ClientSafeError('error-not-allowed');
		}
	}
}
