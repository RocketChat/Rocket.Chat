import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/livechatAgentEditCustomFieldsForm';
import './customTemplates/livechatAgentInfoCustomFieldsForm';
import './customTemplates/visitorForwardCustomFieldsForm';

addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
addCustomFormTemplate('livechatAgentEditForm', 'livechatAgentEditCustomFieldsForm');
addCustomFormTemplate('livechatAgentInfoForm', 'livechatAgentInfoCustomFieldsForm');
addCustomFormTemplate('visitorForward', 'visitorForwardCustomFieldsForm');
