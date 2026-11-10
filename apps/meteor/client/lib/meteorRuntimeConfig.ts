// Single point of access to the `__meteor_runtime_config__` globals that
// Meteor's bootloader injects into the page (ROOT_URL and
// ROOT_URL_PATH_PREFIX). Consumers must read/write through these helpers so
// the eventual replacement (a static config injected at build time) is a
// single-file swap.

type ClientBuildVersions = { versionRefreshable?: string; versionNonRefreshable?: string };

const getConfig = ():
	| {
			ROOT_URL?: string;
			ROOT_URL_PATH_PREFIX?: string;
			isModern?: boolean;
			autoupdate?: { versions?: Record<string, ClientBuildVersions> };
	  }
	| undefined => {
	if (typeof __meteor_runtime_config__ !== 'object' || __meteor_runtime_config__ === null) {
		return undefined;
	}
	return __meteor_runtime_config__;
};

export const getRootUrl = (): string | undefined => getConfig()?.ROOT_URL;

export const getRootUrlPathPrefix = (): string => getConfig()?.ROOT_URL_PATH_PREFIX ?? '';

/** The build this page runs: its client architecture and the versions the server computed for it. */
export const getClientBuild = (): ({ arch: string } & ClientBuildVersions) | undefined => {
	const config = getConfig();
	const arch = config?.isModern === false ? 'web.browser.legacy' : 'web.browser';
	const versions = config?.autoupdate?.versions?.[arch];
	return versions && { arch, ...versions };
};

export const setRootUrl = (value: string): void => {
	const config = getConfig();
	if (config) {
		config.ROOT_URL = value;
	}
};
