import { canDeclineCall } from './constants';
import { buildJoinableCall } from '../fixtures/testFixtures';

// Nothing to turn down for a call the reader is in: the way out is to leave it. And a call already declined has
// no decline left either — its row says so instead.
it('offers no decline for a call that has already been answered, either way', () => {
	expect(canDeclineCall(buildJoinableCall({ callId: 'here', joined: true }))).toBe(false);
	expect(canDeclineCall(buildJoinableCall({ callId: 'gone', declined: true }))).toBe(false);
	expect(canDeclineCall(buildJoinableCall({ callId: 'fresh' }))).toBe(true);
});
