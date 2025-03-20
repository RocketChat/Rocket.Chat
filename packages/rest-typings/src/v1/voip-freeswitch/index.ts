import type { FreeSwitchExtension } from '@rocket.chat/core-typings';

import type { VoipFreeSwitchExtensionAssignProps } from './VoipFreeSwitchExtensionAssignProps';
import type { VoipFreeSwitchExtensionGetDetailsProps } from './VoipFreeSwitchExtensionGetDetailsProps';
import type { VoipFreeSwitchExtensionGetInfoProps } from './VoipFreeSwitchExtensionGetInfoProps';
import type { VoipFreeSwitchExtensionListProps } from './VoipFreeSwitchExtensionListProps';

export * from './VoipFreeSwitchExtensionAssignProps';
export * from './VoipFreeSwitchExtensionGetDetailsProps';
export * from './VoipFreeSwitchExtensionGetInfoProps';
export * from './VoipFreeSwitchExtensionListProps';

export type VoipFreeSwitchEndpoints = {
	'/v1/voip-freeswitch.extension.list': {
		GET: (params: VoipFreeSwitchExtensionListProps) => { extensions: FreeSwitchExtension[] };
	};
	'/v1/voip-freeswitch.extension.getDetails': {
		GET: (params: VoipFreeSwitchExtensionGetDetailsProps) => FreeSwitchExtension & { userId?: string; username?: string; name?: string };
	};
	'/v1/voip-freeswitch.extension.assign': {
		POST: (params: VoipFreeSwitchExtensionAssignProps) => void;
	};
	'/v1/voip-freeswitch.extension.getRegistrationInfoByUserId': {
		GET: (params: VoipFreeSwitchExtensionGetInfoProps) => {
			extension: FreeSwitchExtension;
			credentials: { password: string; websocketPath: string };
		};
	};
};
