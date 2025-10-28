import semver from 'semver';

import { Info } from '../../app/utils/rocketchat.info';

export const shouldBreakInVersion = (version: string) => semver.gte(Info.version, version);
