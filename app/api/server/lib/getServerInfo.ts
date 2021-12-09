
import { Info } from '../../../utils/server';
import { hasRolesAsync } from '../../../authorization/server/functions/hasRole';

type ServerInfo = {
	info: Info;
} | {
	version: string | undefined;
};

const removePatchInfo = (version: string): string => version.replace(/(\d+\.\d+).*/, '$1');

export async function getServerInfo(userId?: string): Promise<ServerInfo> {
	if (userId && await hasRolesAsync(userId, ['admin'])) {
		return {
			info: Info,
		};
	}
	return {
		version: removePatchInfo(Info.version),
	};
}
