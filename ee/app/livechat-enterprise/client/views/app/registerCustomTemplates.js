import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/visitorEditCustomFieldsForm';
import './customTemplates/visitorInfoCustomForm';

addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
addCustomFormTemplate('livechatVisitorEditForm', 'visitorEditCustomFieldsForm');
addCustomFormTemplate('livechatVisitorInfo', 'visitorInfoCustomForm');
