import { applyPendingLicense, hasPendingLicense } from './pendingLicense';

let workspaceUrl: string | undefined;

export const setWorkspaceUrl = async (url: string) => {
	workspaceUrl = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

	if (hasPendingLicense()) {
		await applyPendingLicense();
	}
};

export const getWorkspaceUrl = () => workspaceUrl;
