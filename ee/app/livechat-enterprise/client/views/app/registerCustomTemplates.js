import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/livechatAgentEditCustomFieldsForm';
import './customTemplates/livechatAgentInfoCustomFieldsForm';
import { hasLicense } from '../../../../license/client';

hasLicense('livechat-enterprise').then((enabled) => {
	if (enabled) {
		addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
		addCustomFormTemplate('livechatAgentEditForm', 'livechatAgentEditCustomFieldsForm');
		addCustomFormTemplate('livechatAgentInfoForm', 'livechatAgentInfoCustomFieldsForm');
	}
});
