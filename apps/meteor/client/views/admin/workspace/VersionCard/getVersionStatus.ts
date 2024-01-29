import type { SupportedVersions } from '@rocket.chat/server-cloud-communication';
import semver from 'semver';

import type { VersionStatus } from './components/VersionTag';

export const getVersionStatus = (
	serverVersion: string,
	versions: SupportedVersions['versions'],
): { label: VersionStatus; expiration: Date | undefined; version: string } => {
	const highestVersion = versions
		.sort((prev, current) => semver.compare(current.version, prev.version))
		.filter((v) => {
			const [prerelease] = semver.prerelease(v.version) || [];
			const [currentPrerelease] = semver.prerelease(serverVersion) || [];

			return !prerelease || prerelease === currentPrerelease;
		})[0];

	const currentVersionData =
		versions.find((v) => v.version === serverVersion) ||
		versions.find((v) =>
			semver.satisfies(String(semver.coerce(v.version)), `=${semver.major(serverVersion)}.${semver.minor(serverVersion)}.x`),
		);

	const currentVersionIsExpired = currentVersionData?.expiration && new Date(currentVersionData.expiration) < new Date();

	const isSupported = !currentVersionIsExpired && !!currentVersionData;

	return {
		label: 'outdated',
		version: serverVersion,
		...(isSupported && semver.gte(currentVersionData?.version, highestVersion.version) && { label: 'latest' }),
		...(isSupported &&
			semver.gt(highestVersion.version, currentVersionData?.version) && { label: 'available_version', version: highestVersion.version }),
		expiration: currentVersionData?.expiration,
	};
};
