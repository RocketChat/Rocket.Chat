import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatCustomFieldsAdditionalForm';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/livechatAgentEditCustomFieldsForm';
import './customTemplates/livechatAgentInfoCustomFieldsForm';
import './customTemplates/visitorEditCustomFieldsForm';
import './customTemplates/visitorInfoCustomForm';
import './customTemplates/businessHoursCustomFieldsForm';
import './customTemplates/businessHoursFormField';

addCustomFormTemplate('livechatAgentEditForm', 'livechatAgentEditCustomFieldsForm');
addCustomFormTemplate('livechatAgentInfoForm', 'livechatAgentInfoCustomFieldsForm');
addCustomFormTemplate('livechatCustomFieldsAdditionalForm', 'livechatCustomFieldsAdditionalForm');
addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
addCustomFormTemplate('livechatVisitorEditForm', 'visitorEditCustomFieldsForm');
addCustomFormTemplate('livechatVisitorInfo', 'visitorInfoCustomForm');
