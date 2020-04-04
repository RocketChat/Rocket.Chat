import { addCustomFormTemplate } from '../../../../../../app/livechat/client/views/app/customTemplates/register';
import './customTemplates/livechatDepartmentCustomFieldsForm';
import './customTemplates/livechatAgentEditCustomFieldsForm';
import './customTemplates/livechatAgentInfoCustomFieldsForm';
import './customTemplates/visitorEditCustomFields';
import './customTemplates/visitorRoomInfo';

addCustomFormTemplate('livechatDepartmentForm', 'livechatDepartmentCustomFieldsForm');
addCustomFormTemplate('livechatAgentEditForm', 'livechatAgentEditCustomFieldsForm');
addCustomFormTemplate('livechatAgentInfoForm', 'livechatAgentInfoCustomFieldsForm');
addCustomFormTemplate('visitorEdit', 'visitorEditCustomFields');
addCustomFormTemplate('visitorRoomInfo', 'customVisitorRoomInfo');
