export const customFormTemplate = new Map();

export const addCustomFormTemplate = (form, customTemplateName) => customFormTemplate.set(form, customTemplateName);

export const removeCustomTemplate = (form) => customFormTemplate.delete(form);

export const getCustomFormTemplate = (form) => customFormTemplate.get(form);
