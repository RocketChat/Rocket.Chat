import { useEndpoint, usePermission, useSetting, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { lazy, useEffect } from 'react';

import { useOmnichannelRouteDefinition } from '../../../../../client/hooks/router/useOmnichannelRouteDefinition';
import { CannedResponses } from '../../../../app/canned-responses/client/collections/CannedResponses';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const CannedResponsesRoute = lazy(() => import('../../../omnichannel/cannedResponses/CannedResponsesRoute'));

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'omnichannel-canned-responses': {
			pattern: '/omnichannel/canned-responses/:context?/:id?';
			pathname: `/omnichannel/canned-responses${`/${string}` | ''}${`/${string}` | ''}`;
		};
	}
}

export const useCannedResponses = () => {
	const licensed = useHasLicenseModule('canned-responses') === true;
	const enabled = useSetting<boolean>('Canned_Responses_Enable', false);
	const permittedToView = usePermission('view-canned-responses');
	const permittedToManage = usePermission('manage-livechat-canned-responses');
	const uid = useUserId();

	const subscribeToCannedResponses = useStream('canned-responses');

	useEffect(() => {
		if (!uid || !enabled || !permittedToView) {
			return;
		}

		return subscribeToCannedResponses('canned-responses', (...args) => {
			const [, { agentsId: agentsIds = [] as string[] } = {}] = args;

			if (Array.isArray(agentsIds) && !agentsIds.includes(uid)) {
				return;
			}

			switch (args[0].type) {
				case 'changed': {
					const [{ type, ...response }] = args;
					CannedResponses.upsert({ _id: response._id }, response);
					break;
				}

				case 'removed': {
					const [{ _id }] = args;
					CannedResponses.remove({ _id });
					break;
				}
			}
		});
	}, [enabled, permittedToView, subscribeToCannedResponses, uid]);

	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses.get');

	useQuery(['canned-responses', uid], () => getCannedResponses(), {
		enabled: !!uid && enabled && permittedToView,
		onSuccess: ({ responses }) => {
			for (const response of responses) {
				CannedResponses.upsert({ _id: response._id }, response);
			}
		},
	});

	useOmnichannelRouteDefinition({
		enabled: licensed && permittedToManage,
		id: 'omnichannel-canned-responses',
		path: '/omnichannel/canned-responses/:context?/:id?',
		sidebar: {
			id: 'Canned_Responses',
			href: '/omnichannel/canned-responses',
		},
		element: <CannedResponsesRoute />,
	});
};
