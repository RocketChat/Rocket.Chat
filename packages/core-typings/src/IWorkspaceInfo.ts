import type { IServerInfo } from './IServerInfo';

export type IWorkspaceInfo = {
	info?: IServerInfo;
	supportedVersions?: { signed: string };
	minimumClientVersions: { desktop: string; mobile: string };
	version: string;
};
