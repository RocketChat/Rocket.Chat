import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';


Template.registerHelper('pathFor', (path, { hash }) => FlowRouter.path(path, hash));
