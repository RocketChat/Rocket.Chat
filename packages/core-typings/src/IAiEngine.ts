import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/** A secret an AI agent engine authenticates with; only its SHA-256 verifier is ever stored */
export interface IAiEngineCredential {
	id: string;
	verifier: string;
	createdAt: Date;
	expiresAt: Date;
	revokedAt?: Date;
}

export type AiEngineReportedSeatState = 'unprovisioned' | 'provisioned' | 'claimed' | 'retired';

export type AiEngineSeatAvailability = 'available' | 'unavailable';

export interface IAiEngineObservedCatalogue {
	tools: string[];
	skillsCommit: string;
	skills: string[];
	modelRoutes: string[];
}

export interface IAiEngineObservedSeat {
	seatId: string;
	botId: string;
	state: AiEngineReportedSeatState;
	availability: AiEngineSeatAvailability;
	reason: string;
	allowedRooms: string[];
	acceptedVersion: number;
	poisonFloor: number;
	identity120Seen: boolean;
	admittedQuestionSeen: boolean;
}

export interface IAiEngineObservedReport {
	contractVersion: '1.1.0';
	workspaceId: string;
	reportedAt: Date;
	catalogue: IAiEngineObservedCatalogue;
	seats: IAiEngineObservedSeat[];
}

/** An agent engine linked to the workspace, which reads the records of its seats with its own credential */
export interface IAiEngine extends IRocketChatRecord {
	name: string;
	credentials: IAiEngineCredential[];
	createdBy: IUser['_id'];
	createdAt: Date;
	observed?: IAiEngineObservedReport;
	lastReportAt?: Date;
}
