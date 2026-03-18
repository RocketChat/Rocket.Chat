import type { IConferenceMediaCall, MediaCallContact } from '@rocket.chat/core-typings';
import type { CallFeature, CallRole } from '@rocket.chat/media-signaling';

import { UserActorAgent } from './UserActorAgent';
import type { IMediaCallAgent } from '../../definition/IMediaCallAgent';

export class ConferenceAgent implements IMediaCallAgent {
	public oppositeAgent: IMediaCallAgent | null = null;

	private agents: Map<string, UserActorAgent>;

	constructor(protected readonly callees: MediaCallContact[]) {
		this.agents = new Map();
		this.createSubAgents();
	}

	public get role(): CallRole {
		return 'callee';
	}

	public async onCallAccepted(_callId: string, _data: { signedContractId: string; features: CallFeature[] }): Promise<void> {
		// Nothing to do
	}

	public async onCallEnded(_callId: string): Promise<void> {
		// Nothing to do
	}

	public async onCallActive(_callId: string): Promise<void> {
		// Nothing to do
	}

	public async onCallCreated(call: IConferenceMediaCall): Promise<void> {
		for (const agent of this.agents.values()) {
			await agent.onCallCreated(call);
		}
	}

	public async onRemoteDescriptionChanged(_callId: string, _negotiationId: string): Promise<void> {
		// Nothing to do
	}

	public async onCallTransferred(_callId: string): Promise<void> {
		// Nothing to do
	}

	public async onDTMF(_callId: string, _dtmf: string, _duration: number): Promise<void> {
		// Nothing to do
	}

	private createSubAgents() {
		for (const callee of this.callees) {
			if (callee.type !== 'user') {
				continue;
			}

			const agent = new UserActorAgent(callee, 'callee');
			this.agents.set(callee.id, agent);
		}
	}
}
