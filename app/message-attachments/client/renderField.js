import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

const renderers = {};

/**
 * The field templates will be rendered non-reactive for all messages by the messages-list (@see rocketchat-nrr)
 * Thus, we cannot provide helpers or events to the template, but we need to register this interactivity at the parent
 * template which is the room. The event will be bubbled by the Blaze-framework
 * @param fieldType
 * @param templateName
 * @param helpers
 * @param events
 */
export function registerFieldTemplate(fieldType, templateName, events) {
	renderers[fieldType] = templateName;

	// propagate helpers and events to the room template, changing the selectors
	// loop at events. For each event (like 'click .accept'), copy the function to a function of the room events.
	// While doing that, add the fieldType as class selector to the events function in order to avoid naming clashes
	if (events != null) {
		const uniqueEvents = {};
		// rename the event handlers so they are unique in the "parent" template to which the events bubble
		for (const property in events) {
			if (events.hasOwnProperty(property)) {
				const event = property.substr(0, property.indexOf(' '));
				const selector = property.substr(property.indexOf(' ') + 1);
				Object.defineProperty(uniqueEvents,
					`${ event } .${ fieldType } ${ selector }`,
					{
						value: events[property],
						enumerable: true, // assign as a own property
					});
			}
		}
		Template.room.events(uniqueEvents);
	}
}

// onRendered is not being executed (no idea why). Consequently, we cannot use Blaze.renderWithData(), since we don't
// have access to the DOM outside onRendered. Therefore, we can only translate the content of the field to HTML and
// embed it non-reactively.
// This in turn means that onRendered of the field template will not be processed either.
// I guess it may have someting to do with rocketchat-nrr
Template.renderField.helpers({
	specializedRendering({ hash: { field, message } }) {
		let html = '';
		if (field.type && renderers[field.type]) {
			html = Blaze.toHTMLWithData(Template[renderers[field.type]], { field, message });
		} else {
			// consider the value already formatted as html
			html = field.value;
		}
		return `<div class="${ field.type }">${ html }</div>`;
	},
});
