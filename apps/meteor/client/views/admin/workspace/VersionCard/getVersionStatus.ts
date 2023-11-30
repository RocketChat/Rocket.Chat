import type { SupportedVersions } from '@rocket.chat/server-cloud-communication';
import semver from 'semver';

import type { VersionStatus } from './components/VersionTag';

export const getVersionStatus = (
	serverVersion: string,
	versions: SupportedVersions['versions'],
): { label: VersionStatus; expiration: Date | undefined } => {
	const coercedServerVersion = String(semver.coerce(serverVersion));
	const highestVersion = versions.reduce((prev, current) => (prev.version > current.version ? prev : current));
	const currentVersionData = versions.find((v) => v.version.includes(coercedServerVersion) || v.version.includes(serverVersion));
	const currentVersionIsExpired = currentVersionData?.expiration && new Date(currentVersionData.expiration) < new Date();

	const isSupported =
		!currentVersionIsExpired && (currentVersionData?.version === coercedServerVersion || currentVersionData?.version === serverVersion);

	const versionStatus: {
		label: VersionStatus;
		expiration: Date | undefined;
	} = {
		label: 'outdated',
		...(isSupported && semver.gte(coercedServerVersion, highestVersion.version) && { label: 'latest' }),
		...(isSupported && semver.gt(highestVersion.version, coercedServerVersion) && { label: 'available_version' }),
		expiration: currentVersionData?.expiration,
	};

	return versionStatus;
};
