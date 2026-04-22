import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseAfterHoursNotificationDelivery {
	attemptedChannels: Array<'sms' | 'email'>;
	sentChannels: Array<'sms' | 'email'>;
	recipients?: string[];
	errors?: string[];
	updatedAt?: Date;
}

export interface IMedsenseRequest extends IRocketChatRecord {
	roomId?: string | null; // The patient-pharmacist room
	pharmacyId: string; // The pharmacy this request belongs to
	requestedByUserId: string;
	requestedByUsername?: string;
	specialtyActionId?: string;
	flowId?: string;
	reason: string; // The issue/reason for the request
	status:
		| 'creating_room'
		| 'failed_room_create'
		| 'invite_sent'
		| 'waiting_patient'
		| 'ai_preassessment'
		| 'after_hours'
		| 'waiting_staff'
		| 'ready_for_staff'
		| 'taken'
		| 'closed'; // Status of the request

	createdAt: Date;
	updatedAt: Date;

	takenBy?: {
		_id: string;
		username: string;
	};
	takenAt?: Date;

	closedBy?: {
		_id: string;
		username: string;
	};
	closedAt?: Date;

	// Clinical Flow Fields
	patientStage?: 'pre_assessment' | 'waiting_staff' | 'in_consultation' | 'completed';
	contextSummary?: string;
	answers?: Record<string, any>; // JSON responses from forms
	currentStepId?: string; // Tracks progress in multi-step assessment
	aiSummary?: string;
	aiFollowUpCount?: number;
	preAssessmentExpiresAt?: Date; // Timeout for pre-assessment
	creationError?: string;
	intakeAvailability?: 'open' | 'closed';
	pharmacyTimezone?: string;
	matchedVoiceInboundNumber?: string | null;
	afterHoursNotifications?: {
		patient?: IMedsenseAfterHoursNotificationDelivery;
		pharmacy?: IMedsenseAfterHoursNotificationDelivery;
	};
}
