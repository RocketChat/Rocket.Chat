import type { EventBase } from '../../core/events/eventBase';
import {
	FederationEndpoints,
	type MakeJoinResponse,
	type SendJoinResponse,
	type SendTransactionResponse,
	type Transaction,
	type Version,
} from '../specs/federation-api';
import { FederationConfigService } from './federation-config.service';
import { FederationRequestService } from './federation-request.service';
import { SignatureVerificationService } from './signature-verification.service';
import type { ProtocolVersionKey } from '../../signJson';
import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../utils/logger';

@injectable()
export class FederationService {
	private readonly logger = createLogger('FederationService');

	constructor(
		@inject('FederationConfigService') private readonly configService: FederationConfigService,
		@inject('FederationRequestService') private readonly requestService: FederationRequestService,
		@inject('SignatureVerificationService') private readonly signatureService: SignatureVerificationService,
	) { }

	/**
	 * Get a make_join template for a room and user
	 */
	async makeJoin(
		domain: string,
		roomId: string,
		userId: string,
		version?: string,
	): Promise<MakeJoinResponse> {
		try {
			const uri = FederationEndpoints.makeJoin(roomId, userId);
			const queryParams: Record<string, string> = {};

			if (version) {
				queryParams.ver = version;
			} else {
				for (let ver = 1; ver <= 11; ver++) {
					queryParams[`ver${ver === 1 ? '' : ver}`] = ver.toString();
				}
			}

			return await this.requestService.get<MakeJoinResponse>(
				domain,
				uri,
				queryParams,
			);
		} catch (error: any) {
			this.logger.error(`makeJoin failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Send a join event to a remote server
	 */
	async sendJoin(
		domain: string,
		roomId: string,
		userId: string,
		joinEvent: MakeJoinResponse['event'],
		omitMembers = false,
	): Promise<SendJoinResponse> {
		try {
			const eventWithOrigin = {
				...joinEvent,
				origin: this.configService.serverName,
				origin_server_ts: Date.now(),
			};

			const uri = FederationEndpoints.sendJoinV2(roomId, userId);
			const queryParams = omitMembers ? { omit_members: 'true' } : undefined;

			return await this.requestService.put<SendJoinResponse>(
				domain,
				uri,
				eventWithOrigin,
				queryParams,
			);
		} catch (error: any) {
			this.logger.error(`sendJoin failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Send a transaction to a remote server
	 */
	async sendTransaction(
		domain: string,
		transaction: Transaction,
	): Promise<SendTransactionResponse> {
		try {
			const txnId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
			const uri = FederationEndpoints.sendTransaction(txnId);

			return await this.requestService.put<SendTransactionResponse>(
				domain,
				uri,
				transaction,
			);
		} catch (error: any) {
			this.logger.error(
				`sendTransaction failed: ${error?.message}`,
				error?.stack,
			);
			throw error;
		}
	}

	/**
	 * Send an event to a remote server
	 */
	async sendEvent<T extends EventBase>(domain: string, event: T): Promise<SendTransactionResponse> {
		try {
			const transaction: Transaction = {
				origin: this.configService.serverName,
				origin_server_ts: Date.now(),
				pdus: [event],
			};

			return await this.sendTransaction(domain, transaction);
		} catch (error: any) {
			this.logger.error(`sendEvent failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Get events from a remote server
	 */
	async getEvent(domain: string, eventId: string): Promise<EventBase> {
		try {
			const uri = FederationEndpoints.getEvent(eventId);
			return await this.requestService.get<EventBase>(domain, uri);
		} catch (error: any) {
			this.logger.error(`getEvent failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Get state for a room from remote server
	 */
	async getState(
		domain: string,
		roomId: string,
		eventId: string,
	): Promise<EventBase> {
		try {
			const uri = FederationEndpoints.getState(roomId);
			const queryParams = { event_id: eventId };

			return await this.requestService.get<EventBase>(domain, uri, queryParams);
		} catch (error: any) {
			this.logger.error(`getState failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Get state IDs for a room from remote server
	 */
	async getStateIds(domain: string, roomId: string): Promise<EventBase[]> {
		try {
			const uri = FederationEndpoints.getStateIds(roomId);
			return await this.requestService.get<EventBase[]>(domain, uri);
		} catch (error: any) {
			this.logger.error(`getStateIds failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Get server version information
	 */
	async getVersion(domain: string): Promise<Version> {
		try {
			return await this.requestService.get<Version>(
				domain,
				FederationEndpoints.version,
			);
		} catch (error: any) {
			this.logger.error(`getVersion failed: ${error?.message}`, error?.stack);
			throw error;
		}
	}

	/**
	 * Verify PDU from a remote server
	 */
	async verifyPDU<
		T extends object & {
			signatures?: Record<string, Record<ProtocolVersionKey, string>>;
			unsigned?: unknown;
		},
	>(event: T, originServer: string): Promise<boolean> {
		return this.signatureService.verifySignature(event, originServer);
	}

	/**
	 * Send a room tombstone event to a remote server
	 */
	async sendTombstone(
		domain: string,
		tombstoneEvent: EventBase,
	): Promise<SendTransactionResponse> {
		try {
			return await this.sendEvent(domain, tombstoneEvent);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			this.logger.error(`sendTombstone failed: ${errorMessage}`, errorStack);
			throw error;
		}
	}
}
