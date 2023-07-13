import { useEndpoint, usePermission, useSetting, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { lazy, useEffect } from 'react';

import { ui } from '../../../../../client/lib/ui';
import { registerOmnichannelRoute } from '../../../../../client/views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../../../../client/views/omnichannel/sidebarItems';
import { CannedResponses } from '../../../../app/canned-responses/client/collections/CannedResponse';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const CannedResponse = lazy(() => import('../../../omnichannel/components/contextualBar/CannedResponse'));

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

	useEffect(() => {
		if (!licensed || !enabled) {
			return;
		}

		return ui.addRoomAction('canned-responses', () => {
			return {
				groups: ['live'],
				id: 'canned-responses',
				title: 'Canned_Responses',
				icon: 'canned-response',
				template: CannedResponse,
				order: 0,
			};
		});
	}, [enabled, licensed]);

	const subscribeToCannedResponses = useStream('canned-responses');

	useEffect(() => {
		if (!uid || !enabled || !permittedToView) {
			return;
		}

		return subscribeToCannedResponses('canned-responses', (...args) => {
			const [{ type, ...response }, { agentsId: agentsIds = [] as string[] } = {}] = args;

			if (Array.isArray(agentsIds) && !agentsIds.includes(uid)) {
				return;
			}

			switch (type) {
				case 'changed':
					CannedResponses.upsert({ _id: response._id }, response);
					break;

				case 'removed':
					CannedResponses.remove({ _id: response._id });
					break;
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

	useEffect(() => {
		if (!licensed || !permittedToManage) {
			return;
		}

		registerOmnichannelSidebarItem({
			href: '/omnichannel/canned-responses',
			i18nLabel: 'Canned_Responses',
		});

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute('/canned-responses/:context?/:id?', {
			name: 'omnichannel-canned-responses',
			component: lazy(() => import('../../../omnichannel/cannedResponses/CannedResponsesRoute')),
		});

		return () => {
			unregisterOmnichannelSidebarItem('Canned_Responses');
			unregisterOmnichannelRoute();
		};
	}, [licensed, permittedToManage]);
};
