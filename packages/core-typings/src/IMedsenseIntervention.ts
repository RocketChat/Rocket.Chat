import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IMedsenseDocumentationTemplate } from './IMedsenseDocumentationTemplate';

export interface IInterventionSignature {
	name: string;
	role: 'pharmacist' | 'patient';
	signedAt: Date;
	signatureImageData: string;
}

export interface IMedsenseIntervention extends IRocketChatRecord {
	_id: string;
	pharmacyId: string;
	patientUserId: string;
	type: string;
	specialtyActionId?: string;
	documentationTemplateId?: string;
	documentationTemplateVersion?: number;
	documentationTemplateSnapshot?: IMedsenseDocumentationTemplate;
	documentationValues?: Record<string, any>;
	prescriptions?: any[];
	followUp?: any;
	signatures?: {
		pharmacist?: IInterventionSignature;
		patient?: IInterventionSignature;
	};
	documentationPrefill?: {
		requestedAt?: Date;
		completedAt?: Date;
		model?: string;
		fields?: Array<{
			fieldKey: string;
			sectionKey?: string;
			target?: 'documentation' | 'follow_up' | 'prescription';
			rowIndex?: number;
			suggestedValue?: any;
			confidence?: number;
			reviewStatus?: 'pending' | 'accepted' | 'rejected' | 'modified';
			source?: string;
			reasoningSummary?: string;
		}>;
	};
	documentationStatus?: 'draft' | 'ready_for_review' | 'finalized' | 'signed';
	finalizedAt?: Date;
	finalizedBy?: {
		_id: string;
		username: string;
	};
	notes?: string;
	createdBy: {
		_id: string;
		username: string;
	};
	createdAt: Date;
	_updatedAt: Date;
}
