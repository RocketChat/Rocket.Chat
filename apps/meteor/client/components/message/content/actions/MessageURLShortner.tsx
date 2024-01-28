import type { Root } from '@rocket.chat/message-parser';

const shortURLInMessage = (md: Root) => {
	return md?.map((mdItem) => {
		if (mdItem.value && Array.isArray(mdItem.value)) {
			return {
				...mdItem,
				value: mdItem.value.map((valueItem) => {
					if (valueItem.type === 'LINK' && valueItem.value && Array.isArray(valueItem.value.label)) {
						return {
							...valueItem,
							value: {
								...valueItem.value,
								label: valueItem.value.label.map((labelItem) => {
									if (typeof labelItem.value === 'string') {
										return {
											...labelItem,
											value: labelItem.value.length > 100 ? labelItem.value.substring(0, 100) + '...' : labelItem.value,
										};
									}
									return labelItem;
								}),
							},
						};
					}
					return valueItem;
				}),
			};
		}
		return mdItem;
	}) as Root;
};

export default shortURLInMessage;
