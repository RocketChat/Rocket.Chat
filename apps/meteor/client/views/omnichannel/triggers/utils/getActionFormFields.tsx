import { ExternalServiceActionForm } from '../actions/ExternalServiceActionForm';
import { SendMessageActionForm } from '../actions/SendMessageActionForm';

type TriggerActions = 'send-message' | 'use-external-service';

const actionForms = {
	'send-message': SendMessageActionForm,
	'use-external-service': ExternalServiceActionForm,
} as const;

export const getActionFormFields = (actionName: TriggerActions) => {
	return actionForms[actionName] || actionForms['send-message'];
};
