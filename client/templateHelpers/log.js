import { Template } from 'meteor/templating';

Template.registerHelper('log', (...args) => {
	console.log.apply(console, args);
});
