import { Template } from 'meteor/templating';

Template.registerHelper('nrrargs', <T extends any[]>(...args: T) => ({
	_arguments: args,
}));
