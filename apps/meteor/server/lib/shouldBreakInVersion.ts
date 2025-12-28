import semver from 'semver';

import type { DeprecationLoggerNextPlannedVersion } from '../../app/lib/server/lib/deprecationWarningLogger';
import { Info } from '../../app/utils/rocketchat.info';

export const shouldBreakInVersion = (version: DeprecationLoggerNextPlannedVersion) =>
	Boolean(semver.gte(Info.version, version) && !process.env.TEST_MODE);
