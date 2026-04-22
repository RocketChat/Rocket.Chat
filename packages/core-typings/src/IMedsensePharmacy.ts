import type { IBaseData } from './IBaseData';

export type IMedsenseNotificationChannel = 'none' | 'sms' | 'email' | 'both';

export type IMedsenseOperatingHoursWeekday =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export interface IMedsenseOperatingHoursEntry {
	enabled: boolean;
	start?: string;
	end?: string;
}

export type IMedsenseOperatingHours = Record<IMedsenseOperatingHoursWeekday, IMedsenseOperatingHoursEntry>;

export interface IMedsenseAfterHoursPolicy {
	patientDelivery: IMedsenseNotificationChannel;
	pharmacyDelivery: IMedsenseNotificationChannel;
}

export interface IMedsenseAfterHoursContacts {
	patientMessageTemplate?: string;
	pharmacySmsRecipients: string[];
	pharmacyEmailRecipients: string[];
}

export interface IMedsensePharmacy extends IBaseData {
	name: string;
	slug: string;
	active: boolean;
	voiceInboundNumber?: string | null;
	timezone?: string | null;
	operatingHours?: IMedsenseOperatingHours | null;
	afterHoursPolicy?: IMedsenseAfterHoursPolicy | null;
	afterHoursContacts?: IMedsenseAfterHoursContacts | null;
	createdBy: string;
	createdAt: Date;
	updatedAt?: Date;
}
