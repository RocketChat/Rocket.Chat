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

export type AiEngineReportContractVersion = '1.1.0' | '1.2.0';

export type AiEngineToolEffect = 'read' | 'change';

/** A tool the engine publishes, with the display name the page shows (report 1.2.0) */
export interface IAiEngineObservedToolEntry {
	id: string;
	name: string;
	effect: AiEngineToolEffect;
}

export interface IAiEngineObservedCatalogue {
	tools: string[];
	/** Report 1.2.0 only: one entry per id in `tools` */
	toolEntries?: IAiEngineObservedToolEntry[];
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

/** The tools the engine says one seat may be given (report 1.2.0) */
export interface IAiEngineObservedSeatTools {
	seatId: string;
	allowedTools: string[];
}

export interface IAiEngineObservedReport {
	contractVersion: AiEngineReportContractVersion;
	workspaceId: string;
	reportedAt: Date;
	catalogue: IAiEngineObservedCatalogue;
	seats: IAiEngineObservedSeat[];
	/**
	 * Report 1.2.0 only: the tool ceiling of every seat the engine reported, including seats not yet
	 * registered here, so a seat can be registered against it. Deny-only: it never authorizes a seat.
	 */
	seatTools?: IAiEngineObservedSeatTools[];
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
