import { Template } from 'meteor/templating';

Template.registerHelper('escapeCssUrl', (url) => url.replace(/(['"])/g, '\\$1'));
