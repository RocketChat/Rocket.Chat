import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { LIVEKIT_CAPABILITIES } from '../../../../../server/lib/videoConference/livekitCapabilities';

/**
 * What the LiveKit provider declares, read back through the registry the features actually ask.
 *
 * These are not decorative. Each capability is a gate, and a missing one does not fail loudly — it turns a
 * feature off in silence. `persistentChat` was absent, so `supportsPersistentChat` answered no and
 * `maybeCreateDiscussion` returned without creating one: a LiveKit call in main-room mode had nowhere for its
 * chat to outlive it, with nothing said anywhere about why.
 *
 * The registry is loaded through proxyquire because it reads `server/settings`, whose top-level await this
 * runner cannot transform — the stub below is only there to let the module load.
 */
const proxyquire = require('proxyquire');

const { videoConfProviders, CORE_PROVIDER_APP_ID } = proxyquire.noCallThru().load('../../../../../server/lib/videoConfProviders', {
	'../settings': { settings: { get: () => undefined } },
});

const registered = (): VideoConferenceCapabilities | undefined => videoConfProviders.getProviderCapabilities('livekit');

describe('the LiveKit provider registration', () => {
	beforeEach(() => {
		videoConfProviders.registerProvider('livekit', LIVEKIT_CAPABILITIES, CORE_PROVIDER_APP_ID);
	});

	afterEach(() => {
		videoConfProviders.unRegisterProvider('livekit');
	});

	// `maybeCreateDiscussion` is the only reader left, so this is exactly the discussion-per-call of main-room
	// mode. Thread mode deliberately does not ask: the thread lives in our own chat panel, and gating it here
	// meant no provider an app registers ever got one.
	it('says it can keep the chat, so main-room mode has a discussion to make', () => {
		expect(registered()?.persistentChat).to.be.true;
	});

	// `VideoConfService.isEmbeddedProvider` reads this one: presence leases, the per-member lifecycle, and
	// ringing the callee when the caller actually arrives rather than when they click.
	it('says the call runs inside Rocket.Chat', () => {
		expect(registered()?.embedded).to.be.true;
	});

	// What the preflight offers: two device toggles and a name for the call.
	it('offers the devices and the name the preflight asks about', () => {
		expect(registered()?.mic).to.be.true;
		expect(registered()?.cam).to.be.true;
		expect(registered()?.title).to.be.true;
	});
});
