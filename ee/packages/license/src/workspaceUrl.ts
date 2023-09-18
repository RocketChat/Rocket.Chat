import { validateLicense } from './license';

let workspaceUrl: string | undefined;

export const setWorkspaceUrl = async (url: string) => {
	workspaceUrl = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

	await validateLicense();
};

export const getWorkspaceUrl = () => workspaceUrl;
