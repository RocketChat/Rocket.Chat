import { setValue } from './raw';

export const updateValue = (id, fields) => {
	if (typeof fields.value === 'undefined') {
		return;
	}
	setValue(id, fields.value);
};
