import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseRequest extends IRocketChatRecord {
    roomId: string; // The patient-pharmacist room
    pharmacyId: string; // The pharmacy this request belongs to
    requestedByUserId: string;
    requestedByUsername?: string;
    reason: string; // The issue/reason for the request
    status: 'waiting_patient' | 'ai_preassessment' | 'waiting_staff' | 'taken' | 'closed'; // Status of the request

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
    preAssessmentExpiresAt?: Date; // Timeout for pre-assessment
}
