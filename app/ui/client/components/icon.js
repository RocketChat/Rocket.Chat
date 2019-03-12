import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { isChrome, isFirefox } from '/app/utils';

const baseUrlFix = () => `${ document.baseURI }${ FlowRouter.current().path.substring(1) }`;

Template.icon.helpers({
	baseUrl: ((isFirefox && isFirefox[1] < 55) || (isChrome && isChrome[1] < 55)) ? baseUrlFix : undefined,
});
