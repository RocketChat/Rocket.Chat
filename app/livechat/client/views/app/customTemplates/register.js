export const customFormTemplate = [];

export const addCustomFormTemplate = (form, customTemplateName) => {
	customFormTemplate.push(
		{
			form,
			customTemplateName,
		},
	);
};

export const getCustomFormTemplate = (form) => customFormTemplate.find((template) => template.form === form);
