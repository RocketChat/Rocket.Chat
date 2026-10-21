import type {
	IAppAccessors,
	IConfigurationExtend,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { ApiEndpoint, ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import type {
	IMediaCallAnswerContext,
	IMediaCallDevice,
	IMediaCallDevicesContext,
	IMediaCallDialContext,
	IMediaCallDtmfContext,
	IMediaCallHandler,
	IMediaCallHangupContext,
	IMediaCallHoldContext,
	IMediaCallMuteContext,
	IMediaCallTransferContext,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { AppMethod, RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands';
import type { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

/** How long the far end "rings" before answering, in this simulation. */
const RING_SECONDS = 3;

/**
 * Where a user's phone number is kept. A real integration has no equivalent of this: it asks the
 * gateway which endpoints are registered to the user, rather than having the user type a number in.
 */
function phoneOf(userId: string): RocketChatAssociationRecord {
	return new RocketChatAssociationRecord(RocketChatAssociationModel.USER, `cti-sample-phone-${userId}`);
}

async function readPhone(read: IRead, userId: string): Promise<string | undefined> {
	const [record] = await read.getPersistenceReader().readByAssociation(phoneOf(userId));
	return (record as { number?: string })?.number;
}

/**
 * Calls this app is currently handling, keyed by Rocket.Chat call id.
 *
 * Control commands are broadcast to every app that implements the media-call handler, so an app has
 * to recognise its own calls and leave everyone else's alone. A real integration stores whatever it
 * needs to address the call on the gateway (the gateway's own call handle, the device, the user).
 */
type TrackedCall = {
	callId: string;
	device: string;
	/** The gateway's identifier for the call, if the gateway issues one. */
	gatewayCallId?: string;
};

const TRACKED = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'cti-sample-tracked-calls');

/**
 * Lets a user say which phone is theirs, standing in for the lookup a real integration would do
 * against its gateway.
 *
 *     /cti-phone                  shows the current number
 *     /cti-phone <number>         registers a number
 *     /cti-phone remove           forgets it
 *
 * Until a number is registered the user is offered no devices at all, which is the same answer a real
 * integration gives for someone its gateway does not know.
 */
class CtiPhoneCommand implements ISlashCommand {
	public command = 'cti-phone';

	public i18nParamsExample = '+5551234 | remove';

	public i18nDescription = 'Register the phone number to place Rocket.Chat calls on';

	public providesPreview = false;

	public async executor(
		context: SlashCommandContext,
		read: IRead,
		modify: IModify,
		_http: IHttp,
		persis: IPersistence,
	): Promise<void> {
		const user = context.getSender();
		const [argument] = context.getArguments();

		if (!argument) {
			const current = await readPhone(read, user.id);
			await this.reply(context, modify, current ? `Your calls go to \`${current}\`.` : 'No phone registered. Send `/cti-phone <number>`.');
			return;
		}

		if (argument === 'remove') {
			await persis.removeByAssociation(phoneOf(user.id));
			await modify.getMediaCallModifier().notifyDevicesChanged(user.id);
			await this.reply(context, modify, 'Phone removed. Your calls will stay in Rocket.Chat.');
			return;
		}

		const number = argument.trim();
		if (!/^\+?[0-9][0-9 ()-]*$/.test(number)) {
			await this.reply(context, modify, `\`${number}\` does not look like a phone number.`);
			return;
		}

		await persis.updateByAssociation(phoneOf(user.id), { number }, true);

		// Rocket.Chat caches the device list and has no way of noticing this on its own, so the user
		// would have to reload before the number showed up in the picker.
		await modify.getMediaCallModifier().notifyDevicesChanged(user.id);

		await this.reply(context, modify, `Registered \`${number}\`. It is now offered when you start a call.`);
	}

	private async reply(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
		const message = modify.getCreator().startMessage().setRoom(context.getRoom()).setText(text);

		await modify.getNotifier().notifyUser(context.getSender(), message.getMessage());
	}
}

/**
 * Lets the gateway tell Rocket.Chat about a call arriving on a user's device.
 *
 * A real integration reaches this code from whatever its gateway pushes — a webhook, a socket event,
 * a CSTA notification — rather than from an HTTP endpoint the operator calls by hand.
 *
 * `POST /api/apps/public/:appId/inbound` with `{ userId, from: { id, displayName? } }`.
 */
class InboundCallEndpoint extends ApiEndpoint {
	public path = 'inbound';

	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		read: IRead,
		modify: IModify,
		_http: IHttp,
		_persis: IPersistence,
	): Promise<IApiResponse> {
		const { userId, from } = request.content;

		if (!userId || !from?.id) {
			return { status: 400, content: { error: 'userId and from.id are required' } };
		}

		const device = await readPhone(read, userId);
		if (!device) {
			return { status: 409, content: { error: 'that user has not registered a phone with /cti-phone' } };
		}

		// Rings the user in Rocket.Chat. The widget opens as an incoming call; accepting it sends
		// `answer` back to this app, which is where the gateway is told to pick the line up.
		await modify.getMediaCallModifier().createIncomingCall({
			userId,
			from: { type: 'sip', id: from.id, ...(from.displayName && { displayName: from.displayName }) },
			device,
			features: ['audio', 'hold', 'transfer'],
		});

		return { status: 200, content: { ok: true } };
	}
}

/**
 * Reference integration between Rocket.Chat and a CTI gateway, for calls that happen on a physical
 * desk phone rather than in the browser.
 *
 * Rocket.Chat owns no media for these calls: the phone is registered to the PBX, and Rocket.Chat is
 * a remote control. That splits the work in two directions, and this app shows both:
 *
 * - **Rocket.Chat asks the app to do something** — the `executeMediaCall*` handlers below. Each one
 *   is where a real integration issues the matching request to its gateway (make call, answer, clear,
 *   mute, hold, transfer, send digits).
 * - **The app tells Rocket.Chat what happened** — `modify.getMediaCallModifier()`. The call only
 *   progresses in Rocket.Chat's UI when the app reports it, because the gateway, not Rocket.Chat, is
 *   what knows the line state.
 *
 * Replace every `simulate*` call below with a request to your gateway, and drive the `report*` calls
 * from the gateway's events instead of from timers.
 */
export class CtiGatewaySampleApp extends App implements IMediaCallHandler {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			endpoints: [new InboundCallEndpoint(this)],
		});

		await configuration.slashCommands.provideSlashCommand(new CtiPhoneCommand());
	}

	/**
	 * Offers the user's phone to the device picker. Returning an empty list opts the user out of
	 * desk-phone calls entirely, which is the right answer for someone the gateway does not know —
	 * here, someone who has not run `/cti-phone` yet.
	 */
	public async [AppMethod.EXECUTE_MEDIA_CALL_GET_DEVICES](
		context: IMediaCallDevicesContext,
		read: IRead,
	): Promise<IMediaCallDevice[]> {
		// A real integration looks the user up on the gateway here instead.
		const number = await readPhone(read, context.userId);

		return number ? [{ id: number, name: `Desk phone (${number})` }] : [];
	}

	/**
	 * Places an outbound call: the user's own phone is made to ring, and once they lift it the gateway
	 * dials the far end.
	 */
	public async [AppMethod.EXECUTE_MEDIA_CALL_DIAL](
		context: IMediaCallDialContext,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		const { call, device } = context;

		// Control is broadcast to every cti app, so ignore a call placed on a device that is not the
		// one this app registered for that user.
		const registered = call.caller.type === 'user' ? await readPhone(read, call.caller.id) : undefined;
		if (!registered || registered !== device) {
			return;
		}

		// Where a real integration issues its "make call" request, e.g.
		//   await http.post(`${gateway}/calls`, { data: { from: device, to: call.callee.id } });
		// and keeps whatever handle the gateway returns.
		this.getLogger().info('dialing', { callId: call.id, device, to: call.callee.id });

		await this.track(read, persistence, { callId: call.id, device });

		// Report progress as the gateway reports it. Nothing moves in the Rocket.Chat UI until it does.
		await modify.getMediaCallModifier().reportRinging(call.id);
		await this.simulateFarEndAnswering(call.id, modify);
	}

	/** The user accepted an inbound call in Rocket.Chat; tell the gateway to pick the line up. */
	public async [AppMethod.EXECUTE_MEDIA_CALL_ANSWER](
		context: IMediaCallAnswerContext,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		const { call } = context;

		// An inbound call is tracked on answer rather than on creation, because the call id only
		// exists once Rocket.Chat has created it.
		if (!(await this.owns(read, call.id))) {
			const device = call.callee.type === 'user' ? await readPhone(read, call.callee.id) : undefined;
			if (!device) {
				return;
			}
			await this.track(read, persistence, { callId: call.id, device });
		}

		this.getLogger().info('answering', { callId: call.id });

		// e.g. await http.post(`${gateway}/calls/${handle}/answer`);
		await modify.getMediaCallModifier().reportActive(call.id);
	}

	public async [AppMethod.EXECUTE_MEDIA_CALL_HANGUP](
		context: IMediaCallHangupContext,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		if (!(await this.owns(read, context.call.id))) {
			return;
		}

		this.getLogger().info('clearing', { callId: context.call.id, reason: context.reason });

		// e.g. await http.post(`${gateway}/calls/${handle}/clear`);
		// Hanging up has to tolerate arriving after the gateway already cleared the line — the user
		// pressing the red button and the far end hanging up can happen at the same moment.
		await modify.getMediaCallModifier().reportEnded(context.call.id, context.reason);
		await this.untrack(read, persistence, context.call.id);
	}

	public async [AppMethod.EXECUTE_MEDIA_CALL_MUTE](
		context: IMediaCallMuteContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		if (!(await this.owns(read, context.call.id))) {
			return;
		}

		// e.g. await http.post(`${gateway}/calls/${handle}/mute`, { data: { muted: context.muted } });
		// Confirming it back is what settles the widget: until then the button is only optimistic.
		await modify.getMediaCallModifier().reportState(context.call.id, { muted: context.muted });
	}

	public async [AppMethod.EXECUTE_MEDIA_CALL_HOLD](
		context: IMediaCallHoldContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		if (!(await this.owns(read, context.call.id))) {
			return;
		}

		// e.g. await http.post(`${gateway}/calls/${handle}/hold`, { data: { held: context.held } });
		await modify.getMediaCallModifier().reportState(context.call.id, { held: context.held });
	}

	/**
	 * Transfers the call away. The gateway performs the transfer, so Rocket.Chat's own call simply
	 * ends once the gateway confirms the line moved.
	 */
	public async [AppMethod.EXECUTE_MEDIA_CALL_TRANSFER](
		context: IMediaCallTransferContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<void> {
		if (!(await this.owns(read, context.call.id))) {
			return;
		}

		this.getLogger().info('transferring', { callId: context.call.id, to: context.to.id });

		// e.g. await http.post(`${gateway}/calls/${handle}/transfer`, { data: { to: context.to.id } });
	}

	/** Digits typed on the Rocket.Chat keypad, to be played onto the line by the gateway. */
	public async [AppMethod.EXECUTE_MEDIA_CALL_DTMF](
		context: IMediaCallDtmfContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		_modify: IModify,
	): Promise<void> {
		if (!(await this.owns(read, context.call.id))) {
			return;
		}

		// e.g. await http.post(`${gateway}/calls/${handle}/dtmf`, { data: { tone: context.tone } });
		this.getLogger().debug('dtmf', { callId: context.call.id, tone: context.tone });
	}

	/**
	 * Stands in for the gateway reporting that the far end picked up. A real integration deletes this
	 * and calls `reportAnswered` / `reportActive` from the gateway's own events.
	 */
	private async simulateFarEndAnswering(callId: string, modify: IModify): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, RING_SECONDS * 1000));

		const mediaCalls = modify.getMediaCallModifier();
		await mediaCalls.reportAnswered(callId, ['audio', 'hold', 'transfer']);
		await mediaCalls.reportActive(callId);
	}

	private async owns(read: IRead, callId: string): Promise<boolean> {
		const calls = await this.readTracked(read);
		return calls.some((call) => call.callId === callId);
	}

	private async readTracked(read: IRead): Promise<TrackedCall[]> {
		const [record] = await read.getPersistenceReader().readByAssociation(TRACKED);
		return ((record as { calls?: TrackedCall[] })?.calls ?? []) as TrackedCall[];
	}

	private async track(read: IRead, persistence: IPersistence, call: TrackedCall): Promise<void> {
		const calls = await this.readTracked(read);
		await persistence.updateByAssociation(TRACKED, { calls: [...calls, call] }, true);
	}

	private async untrack(read: IRead, persistence: IPersistence, callId: string): Promise<void> {
		const calls = await this.readTracked(read);
		await persistence.updateByAssociation(TRACKED, { calls: calls.filter((call) => call.callId !== callId) }, true);
	}
}
