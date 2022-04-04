/**
 * The field templates will be rendered non-reactive for all messages by the messages-list (@see rocketchat-nrr)
 * Thus, we cannot provide helpers or events to the template, but we need to register this interactivity at the parent
 * template which is the room. The event will be bubbled by the Blaze-framework
 * @param fieldType
 * @param templateName
 * @param helpers
 * @param events
 */
export function registerFieldTemplate() {
	console.warn('registerFieldTemplate DEPRECATED');
}
