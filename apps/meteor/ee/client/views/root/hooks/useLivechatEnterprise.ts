import { useLivechatEnterpriseAdditionalForms } from '../../../omnichannel/hooks/useLivechatEnterpriseAdditionalForms';
import { useLivechatEnterpriseMessageTypes } from '../../../omnichannel/hooks/useLivechatEnterpriseMessageTypes';
import { useLivechatEnterpriseMonitors } from '../../../omnichannel/hooks/useLivechatEnterpriseMonitors';
import { useLivechatEnterprisePriorities } from '../../../omnichannel/hooks/useLivechatEnterprisePriorities';
import { useLivechatEnterpriseSlaPolicies } from '../../../omnichannel/hooks/useLivechatEnterpriseSlaPolicies';
import { useLivechatEnterpriseTags } from '../../../omnichannel/hooks/useLivechatEnterpriseTags';
import { useLivechatEnterpriseUnits } from '../../../omnichannel/hooks/useLivechatEnterpriseUnits';

export const useLivechatEnterprise = () => {
	useLivechatEnterpriseAdditionalForms();
	useLivechatEnterpriseMessageTypes();
	useLivechatEnterpriseMonitors();
	useLivechatEnterprisePriorities();
	useLivechatEnterpriseSlaPolicies();
	useLivechatEnterpriseTags();
	useLivechatEnterpriseUnits();
};
