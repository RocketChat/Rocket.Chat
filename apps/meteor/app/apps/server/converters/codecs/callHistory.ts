import type { IAppsCallHistoryCallDetails, IAppsCallHistoryItem } from '@rocket.chat/apps';
import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import * as z from 'zod';

/**
 * Rocket.Chat `CallHistoryItem` -> Apps-Engine call history item.
 *
 * Bespoke and one-directional, like `SettingCodec`: an app can read a finished call but never
 * write one, so `encode` throws rather than emitting a lossy document.
 *
 * The stored type is a discriminated union — internal rows name the other party by user id,
 * external rows by phone number — which `decode` flattens into a single `contact` so an app does
 * not have to branch on `external` to find out who the call was with.
 *
 * Only `type: 'media-call'` rows are convertible. The `mitel` variant comes from a vendor CDR
 * import, carries a `callId` that is not a Rocket.Chat call id, and is not part of the published
 * SDK; callers must filter it out before they get here.
 */
export const CallHistoryItemCodec = z.codec(z.custom<CallHistoryItem>(), z.custom<IAppsCallHistoryItem>(), {
	decode: (item): IAppsCallHistoryItem => {
		// Unreachable by types today, because `media-call` is currently the only variant the
		// stored union has. It becomes reachable the moment a second one is added, which is
		// exactly when a silent mis-conversion would be hardest to notice -- hence the guard,
		// and the cast that keeps the message readable while the narrowed type is `never`.
		if (item.type !== 'media-call') {
			const unsupportedType = (item as { type: string }).type;

			throw new Error(`CallHistoryItemCodec: unsupported call history type "${unsupportedType}"`);
		}

		return {
			id: item._id,
			callId: item.callId,
			uid: item.uid,
			ts: item.ts,
			endedAt: item.endedAt,
			direction: item.direction,
			state: item.state,
			durationSeconds: item.duration,
			contact: item.external
				? {
						type: 'external',
						number: item.contactExtension,
					}
				: {
						type: 'user',
						userId: item.contactId,
						username: item.contactUsername,
						displayName: item.contactName,
					},
			...(!item.external && item.rid && { roomId: item.rid }),
			...(!item.external && item.messageId && { messageId: item.messageId }),
		} as unknown as IAppsCallHistoryItem;
	},
	encode: (): CallHistoryItem => {
		throw new Error('CallHistoryItemCodec: converting an Apps-Engine call history item back to a Rocket.Chat one is not supported');
	},
});

/**
 * Rocket.Chat `IMediaCall` -> the audit detail an app sees beside a history row.
 *
 * This is a **strict whitelist written out by hand**, and that is the security property, not a
 * style choice. `IMediaCall` carries `caller.contractId` / `callee.contractId` / `createdBy
 * .contractId` — per-session signing credentials — plus `expiresAt` and `callerRequestedId`, none
 * of which an app may ever see. Naming every field individually, with no `_unmappedProperties_`
 * bucket, is what keeps them out. Do not rewrite this with `mappedDecode` unless you pass
 * `{ dropUnmapped: true }`, and do not spread the source document.
 *
 * The contacts are omitted wholesale rather than filtered: the history row already identifies the
 * other party, so there is nothing here worth the risk of reintroducing a credential.
 */
export const CallHistoryCallDetailsCodec = z.codec(z.custom<IMediaCall>(), z.custom<IAppsCallHistoryCallDetails>(), {
	decode: (call): IAppsCallHistoryCallDetails => ({
		state: call.state,
		hangupReason: call.hangupReason,
		endedBy: call.endedBy && { type: call.endedBy.type, id: call.endedBy.id },
		acceptedAt: call.acceptedAt,
		activatedAt: call.activatedAt,
		endedAt: call.endedAt,
		transferredAt: call.transferredAt,
		parentCallId: call.parentCallId,
		features: call.features ?? [],
	}),
	encode: (): IMediaCall => {
		throw new Error('CallHistoryCallDetailsCodec: converting Apps-Engine call details back to a media call is not supported');
	},
});
