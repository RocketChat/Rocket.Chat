import type { ICalendarService } from '@rocket.chat/core-services';
import { Presence, ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent, Users } from '@rocket.chat/models';
import type { UpdateResult, DeleteResult } from 'mongodb';

import { getShiftedTime } from './utils/getShiftedTime';
import { settings } from '../../../app/settings/server';
import { getUserPreference } from '../../../app/utils/server/lib/getUserPreference';
import { i18n } from '../../lib/i18n';

const logger = new Logger('Calendar');

const defaultMinutesForNotifications = 5;

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderTime' | 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { uid, startTime, endTime, subject, description, reminderMinutesBeforeStart, meetingUrl, busy } = data;
		const minutes = reminderMinutesBeforeStart ?? defaultMinutesForNotifications;
		const reminderTime = minutes ? getShiftedTime(startTime, -minutes) : undefined;

		const insertData: InsertionModel<ICalendarEvent> = {
			uid,
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart: minutes,
			reminderTime,
			notificationSent: false,
			...(busy !== undefined && { busy }),
		};

		const insertResult = await CalendarEvent.insertOne(insertData);
		await this.setupNextNotification();
		if (busy !== false) {
			await this.setupNextStatusChange();
			await this.reconcileInProgressEvent(insertResult.insertedId);
		}

		return insertResult.insertedId;
	}

	public async import(data: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { externalId } = data;
		if (!externalId) {
			return this.create(data);
		}

		const { uid, startTime, endTime, subject, description, reminderMinutesBeforeStart, busy } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description);
		const reminderTime = reminderMinutesBeforeStart ? getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Omit<InsertionModel<ICalendarEvent>, 'uid' | 'notificationSent'> = {
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			externalId,
			...(busy !== undefined && { busy }),
		};

		const event = await this.findImportedEvent(externalId, uid);

		if (!event) {
			const insertResult = await CalendarEvent.insertOne({
				uid,
				notificationSent: false,
				...updateData,
			});

			await this.setupNextNotification();
			if (busy !== false) {
				await this.setupNextStatusChange();
				await this.reconcileInProgressEvent(insertResult.insertedId);
			}

			return insertResult.insertedId;
		}

		const updateResult = await CalendarEvent.updateEvent(event._id, updateData);
		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();
			if (busy !== false) {
				await this.setupNextStatusChange();
				await this.reconcileInProgressEvent(event._id);
			}
		}

		return event._id;
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult | null> {
		const event = await this.get(eventId);
		if (!event) {
			return null;
		}

		const { startTime, endTime, subject, description, reminderMinutesBeforeStart, busy } = data;

		const meetingUrl = await this.getMeetingUrl(data);
		const reminderTime = reminderMinutesBeforeStart && startTime ? getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Partial<ICalendarEvent> = {
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			...(busy !== undefined && { busy }),
		};

		const updateResult = await CalendarEvent.updateEvent(eventId, updateData);

		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();

			if (startTime || endTime) {
				const isBusy = busy !== undefined ? busy : event.busy !== false;
				if (isBusy) {
					await this.setupNextStatusChange();
					await this.reconcileInProgressEvent(eventId);
				}
			}
		}

		return updateResult;
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		const event = await this.get(eventId);
		const now = new Date();
		const wasInProgress = Boolean(event && event.busy !== false && event.startTime <= now && (!event.endTime || event.endTime > now));

		const result = await CalendarEvent.deleteOne({
			_id: eventId,
		});

		if (result.deletedCount > 0) {
			await this.setupNextStatusChange();

			// deleting an in-progress busy event: recompute the claim from the events still active
			if (event && wasInProgress) {
				await this.syncBusyPresence(event.uid, { excludeEventId: eventId, now });
			}
		}

		return result;
	}

	public async setupNextNotification(): Promise<void> {
		return this.doSetupNextNotification(false);
	}

	public async setupNextStatusChange(): Promise<void> {
		return this.doSetupNextStatusChange();
	}

	private async getMeetingUrl(eventData: Partial<ICalendarEvent>): Promise<string | undefined> {
		if (eventData.meetingUrl !== undefined) {
			return eventData.meetingUrl || undefined;
		}

		if (eventData.description !== undefined) {
			return this.parseDescriptionForMeetingUrl(eventData.description);
		}

		return undefined;
	}

	private async doSetupNextNotification(isRecursive: boolean): Promise<void> {
		const date = await CalendarEvent.findNextNotificationDate();
		if (!date) {
			if (await cronJobs.has('calendar-reminders')) {
				await cronJobs.remove('calendar-reminders');
			}
			return;
		}

		date.setSeconds(0);
		if (!isRecursive && date.valueOf() < Date.now()) {
			return this.sendCurrentNotifications(date);
		}

		await cronJobs.addAtTimestamp('calendar-reminders', date, async () => this.sendCurrentNotifications(date));
	}

	private async doSetupNextStatusChange(): Promise<void> {
		// Schedules only event starts; event end is handled by the presence engine's expiration cron.

		const schedulerJobId = 'calendar-status-scheduler';

		const busyStatusEnabled = settings.get<boolean>('Calendar_BusyStatus_Enabled');
		if (!busyStatusEnabled) {
			if (await cronJobs.has(schedulerJobId)) {
				await cronJobs.remove(schedulerJobId);
			}
			return;
		}

		if (await cronJobs.has(schedulerJobId)) {
			await cronJobs.remove(schedulerJobId);
		}

		const nextStartEvent = await CalendarEvent.findNextFutureEvent(new Date());
		if (!nextStartEvent) {
			return;
		}

		await cronJobs.addAtTimestamp(schedulerJobId, nextStartEvent.startTime, async () => this.processStatusChangesAtTime());
	}

	private async processStatusChangesAtTime(): Promise<void> {
		const processTime = new Date();

		try {
			const eventsStartingNow = await CalendarEvent.findEventsStartingNow({ now: processTime, offset: 5000 }).toArray();
			for await (const event of eventsStartingNow) {
				if (event.busy === false) {
					continue;
				}
				await this.processEventStart(event);
			}
		} catch (err) {
			logger.error({ msg: 'Failed to process calendar status changes', err });
		}

		await this.doSetupNextStatusChange();
	}

	private async processEventStart(event: ICalendarEvent): Promise<void> {
		// no endTime → no expiry to set, so the claim could never auto-clear
		if (!event.endTime) {
			return;
		}

		await this.syncBusyPresence(event.uid, { excludeEventId: event._id, seedEndTime: event.endTime });
	}

	// The start scheduler only fires at start times, so it misses an event imported already in progress.
	private async reconcileInProgressEvent(eventId: ICalendarEvent['_id']): Promise<void> {
		const event = await CalendarEvent.findOne({ _id: eventId });
		if (!event?.endTime || event.busy === false) {
			return;
		}

		const now = new Date();
		if (event.startTime > now || event.endTime <= now) {
			return;
		}

		await this.syncBusyPresence(event.uid, { excludeEventId: event._id, seedEndTime: event.endTime, now });
	}

	// Derives "busy until the latest active meeting ends" from the events in progress now and applies
	// it as one calendar claim. `excludeEventId`/`seedEndTime` re-add the triggering event's own end.
	private async syncBusyPresence(
		uid: IUser['_id'],
		{ excludeEventId, seedEndTime, now = new Date() }: { excludeEventId?: ICalendarEvent['_id']; seedEndTime?: Date; now?: Date } = {},
	): Promise<void> {
		if (!settings.get<boolean>('Calendar_BusyStatus_Enabled')) {
			return;
		}

		const overlappingEvents = await CalendarEvent.findOverlappingEvents(excludeEventId ?? '', uid, now, now).toArray();
		const endTimes = [...(seedEndTime ? [seedEndTime] : []), ...overlappingEvents.map((event) => event.endTime)].filter(
			(date): date is Date => Boolean(date),
		);

		// No busy event left → end the calendar claim (no-op if a higher-priority status took over).
		if (endTimes.length === 0) {
			await Presence.endActiveState(uid, this.name);
			return;
		}

		const statusExpiresAt = endTimes.reduce((latest, date) => (date > latest ? date : latest));
		const user = await Users.findOneById<Pick<IUser, '_id' | 'language'>>(uid, { projection: { language: 1 } });
		const lng = user?.language || settings.get<string>('Language') || 'en';

		await Presence.setActiveState(uid, {
			statusDefault: UserStatus.BUSY,
			statusText: i18n.t('Presence_status_in_a_meeting', { lng }),
			statusSource: 'external',
			statusExpiresAt,
			statusId: this.name,
		});
	}

	private async sendCurrentNotifications(date: Date): Promise<void> {
		const events = await CalendarEvent.findEventsToNotify(date, 1).toArray();
		for await (const event of events) {
			await this.sendEventNotification(event);
			await CalendarEvent.flagNotificationSent(event._id);
		}

		await this.doSetupNextNotification(true);
	}

	private async sendEventNotification(event: ICalendarEvent): Promise<void> {
		if (!(await getUserPreference(event.uid, 'notifyCalendarEvents'))) {
			return;
		}

		return api.broadcast('notify.calendar', event.uid, {
			title: event.subject,
			text: event.startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', dayPeriod: 'narrow' }),
			payload: {
				_id: event._id,
				startTimeUtc: event.startTime.toISOString(),
			},
		});
	}

	private async findImportedEvent(
		externalId: Required<ICalendarEvent>['externalId'],
		uid: ICalendarEvent['uid'],
	): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOneByExternalIdAndUserId(externalId, uid);
	}

	private async parseDescriptionForMeetingUrl(description: string): Promise<string | undefined> {
		if (!description) {
			return;
		}

		const defaultPattern = '(?:[?&]callUrl=([^\n&<]+))|(?:(?:%3F)|(?:%26))callUrl(?:%3D)((?:(?:[^\n&<](?!%26)))+[^\n&<]?)';
		const pattern = (settings.get<string>('Calendar_MeetingUrl_Regex') || defaultPattern).trim();

		if (!pattern) {
			return;
		}

		const regex: RegExp | undefined = (() => {
			try {
				return new RegExp(pattern, 'im');
			} catch {
				logger.error('Failed to parse regular expression for meeting url.');
			}
		})();

		if (!regex) {
			return;
		}

		const results = description.match(regex);
		if (!results) {
			return;
		}

		const [, ...urls] = results;
		for (const encodedUrl of urls) {
			if (!encodedUrl) {
				continue;
			}

			let url = encodedUrl;
			while (!url.includes('://')) {
				const decodedUrl = decodeURIComponent(url);
				if (decodedUrl === url) {
					break;
				}

				url = decodedUrl;
			}

			if (url.includes('://')) {
				return url;
			}
		}

		return undefined;
	}
}
