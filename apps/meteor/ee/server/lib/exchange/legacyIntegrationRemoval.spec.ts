import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import semver from 'semver';

/**
 * A tripwire, not a behaviour test: the legacy desktop integration is announced as deprecated in the admin
 * UI and OS2S-51 removes it, and this test, in the major below. Until then it stays green and costs nothing.
 */
const REMOVED_IN = '10.0.0';

// Straight off disk, because every spec that reaches for `Info` mocks it, and a mocked version proves nothing.
const currentVersion = (): string => JSON.parse(readFileSync(join(__dirname, '../../../../app/utils/rocketchat.info'), 'utf8')).version;

describe('the legacy Outlook integration', () => {
	it(`is still shipping, and OS2S-51 was meant to have taken it out before ${REMOVED_IN}`, () => {
		expect(semver.major(currentVersion())).toBeLessThan(semver.major(REMOVED_IN));
	});
});
