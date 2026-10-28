import type { IServerInfo } from './IServerInfo';

export interface IWorkspaceInfo {
	workspaceUrl?: string;
	hashedWorkspaceUrl?: string;
	info?: IServerInfo;
	supportedVersions?: { signed: string };
	minimumClientVersions: { desktop: string; mobile: string };
	version: string;
	cloudWorkspaceId?: string;
}
