import { ICustomField } from './ICustomField';

export interface ILivechatCustomField
	extends Omit<
		ICustomField,
		'type' | 'required' | 'defaultValue' | 'options' | 'public' | 'minLength' | 'maxLength' | 'modifyRecordField' | 'sendToIntegrations'
	> {
	label: string;
	scope: 'visitor' | 'room';
	visibility: string;
}
