import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { businessHourManager } from '../../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import type { IBusinessHourBehavior } from '../../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { EESingleBusinessHourBehaviour } from '../../../../app/livechat-enterprise/client/EESingleBusinessHourBehaviour';
import { MultipleBusinessHoursBehavior } from '../../../../app/livechat-enterprise/client/MultipleBusinessHoursBehavior';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useLivechatEnterpriseAdditionalForms } from '../../../omnichannel/hooks/useLivechatEnterpriseAdditionalForms';
import { useLivechatEnterpriseMessageTypes } from '../../../omnichannel/hooks/useLivechatEnterpriseMessageTypes';
import { useLivechatEnterpriseMonitors } from '../../../omnichannel/hooks/useLivechatEnterpriseMonitors';
import { useLivechatEnterprisePriorities } from '../../../omnichannel/hooks/useLivechatEnterprisePriorities';
import { useLivechatEnterpriseSlaPolicies } from '../../../omnichannel/hooks/useLivechatEnterpriseSlaPolicies';
import { useLivechatEnterpriseTags } from '../../../omnichannel/hooks/useLivechatEnterpriseTags';
import { useLivechatEnterpriseUnits } from '../../../omnichannel/hooks/useLivechatEnterpriseUnits';

const businessHoursBehaviors = {
	Single: new EESingleBusinessHourBehaviour(),
	Multiple: new MultipleBusinessHoursBehavior(),
} satisfies Record<string, IBusinessHourBehavior>;

export const useLivechatEnterprise = () => {
	useLivechatEnterpriseAdditionalForms();
	useLivechatEnterpriseMessageTypes();
	useLivechatEnterpriseMonitors();
	useLivechatEnterprisePriorities();
	useLivechatEnterpriseSlaPolicies();
	useLivechatEnterpriseTags();
	useLivechatEnterpriseUnits();

	const licensed = useHasLicenseModule('livechat-enterprise') === true;

	useEffect(() => {
		if (!licensed) {
			return;
		}

		import('../../../../../client/views/room/lib/QuickActions').then(({ QuickActionsEnum, addAction }) => {
			addAction(QuickActionsEnum.OnHoldChat, {
				groups: ['live'],
				id: QuickActionsEnum.OnHoldChat,
				title: 'Omnichannel_onHold_Chat',
				icon: 'pause-unfilled',
				order: 4,
			});
		});

		return () => {
			import('../../../../../client/views/room/lib/QuickActions').then(({ QuickActionsEnum, deleteAction }) => {
				deleteAction(QuickActionsEnum.OnHoldChat);
			});
		};
	}, [licensed]);

	const businessHourType = useSetting<'Single' | 'Multiple'>('Livechat_business_hour_type', 'Single');

	useEffect(() => {
		if (!licensed) {
			return;
		}

		businessHourManager.registerBusinessHourBehavior(businessHoursBehaviors[businessHourType]);
	}, [licensed, businessHourType]);
};
