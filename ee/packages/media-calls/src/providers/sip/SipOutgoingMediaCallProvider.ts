import type { CallRole } from '@rocket.chat/media-signaling';

import { BaseMediaCallProvider } from '../BaseMediaCallProvider';
import type { IMediaCallProvider } from '../IMediaCallProvider';

export class SipOutgoingMediaCallProvider extends BaseMediaCallProvider implements IMediaCallProvider {
	public readonly providerName = 'sip.outgoing';

	public readonly supportedRoles: CallRole[] = ['callee'];

	public readonly actorType = 'sip';
}
