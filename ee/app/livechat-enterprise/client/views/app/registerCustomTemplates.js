import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/livechatAgentEditCustomFieldsForm';
import './customTemplates/livechatAgentInfoCustomFieldsForm';
import './customTemplates/visitorEditCustomFieldsForm';
import './customTemplates/visitorInfoCustomForm';

addCustomFormTemplate('livechatAgentEditForm', 'livechatAgentEditCustomFieldsForm');
addCustomFormTemplate('livechatAgentInfoForm', 'livechatAgentInfoCustomFieldsForm');
addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
addCustomFormTemplate('livechatVisitorEditForm', 'visitorEditCustomFieldsForm');
addCustomFormTemplate('livechatVisitorInfo', 'visitorInfoCustomForm');
