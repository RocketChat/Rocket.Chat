import { Template } from 'meteor/templating';

Template.registerHelper('log', (...args: unknown[]) => {
	console.log(...args);
});
