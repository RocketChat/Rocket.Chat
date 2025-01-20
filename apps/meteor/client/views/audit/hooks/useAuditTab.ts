import type { IAuditLog } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { SetStateAction } from 'react';
import { useMemo } from 'react';

const typeToTabMap: Record<IAuditLog['fields']['type'], string> = {
	'': 'rooms',
	'u': 'users',
	'd': 'direct',
	'l': 'omnichannel',
};

const tabToTabMap = new Map(Object.entries(typeToTabMap).map(([type, tab]) => [tab, type as IAuditLog['fields']['type']]));

export const useAuditTab = () => {
	const tab = useRouteParameter('tab');
	const type = useMemo(() => tabToTabMap.get(tab ?? 'rooms') ?? '', [tab]);

	const auditRoute = useRoute('audit-home');

	const setType = useEffectEvent((newType: SetStateAction<IAuditLog['fields']['type']>) => {
		auditRoute.replace({ tab: typeToTabMap[typeof newType === 'function' ? newType(type) : newType] ?? 'rooms' });
	});

	return [type, setType] as const;
};
