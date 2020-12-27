import React from 'react';

import { capitalize } from '../../lib/capitalize';
import CustomTextInput from './CustomTextInput';
import CustomSelect from './CustomSelect';

const CustomFieldsAssembler = ({ formValues, formHandlers, customFields, ...props }) => Object.entries(customFields).map(([key, value]) => {
	const extraProps = {
		key,
		name: key,
		setState: formHandlers[`handle${ capitalize(key) }`],
		state: formValues[key],
		...value,
	};

	if (value.type === 'select') {
		return <CustomSelect {...extraProps} {...props}/>;
	}

	if (value.type === 'text') {
		return <CustomTextInput {...extraProps} {...props}/>;
	}

	return null;
});

export default CustomFieldsAssembler;
