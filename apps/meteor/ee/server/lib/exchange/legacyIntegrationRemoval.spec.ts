import semver from 'semver';

import { version } from '../../../../package.json';

/**
 * A tripwire, not a behaviour test: the legacy desktop integration is announced as deprecated in the admin
 * UI and OS2S-51 removes it, and this test, in the major below. Until then it stays green and costs nothing.
 */
const REMOVED_IN = '10.0.0';

describe('the legacy Outlook integration', () => {
	it(`is still shipping, and OS2S-51 was meant to have taken it out before ${REMOVED_IN}`, () => {
		expect(semver.major(version)).toBeLessThan(semver.major(REMOVED_IN));
	});
});
