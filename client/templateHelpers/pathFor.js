import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';


Template.registerHelper('pathFor', (path, { hash }) => FlowRouter.path(path, hash));
