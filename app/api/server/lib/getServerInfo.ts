import { Info } from '../../../utils/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

type ServerInfo =
	| {
			info: Info;
	  }
	| {
			version: string | undefined;
	  };

const removePatchInfo = (version: string): string => version.replace(/(\d+\.\d+).*/, '$1');

export async function getServerInfo(userId?: string): Promise<ServerInfo> {
	if (userId && (await hasPermissionAsync(userId, 'get-server-info'))) {
		return {
			info: Info,
		};
	}
	return {
		version: removePatchInfo(Info.version),
	};
}
