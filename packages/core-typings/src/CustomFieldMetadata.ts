import type { SelectOption } from '@rocket.chat/fuselage';

export type CustomFieldMetadata = {
	name: string;
	label?: string;
	type: 'select' | 'text';
	required?: boolean;
	defaultValue?: any;
	minLength?: number;
	maxLength?: number;
	options?: SelectOption[];
};
