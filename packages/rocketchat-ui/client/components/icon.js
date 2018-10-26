/* globals isFirefox, isChrome */
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

const baseUrlFix = () => `${ window.location.origin }${ FlowRouter.current().path }`;

Template.icon.helpers({
	baseUrl: ((isFirefox && isFirefox[1] < 55) || (isChrome && isChrome[1] < 55)) ? baseUrlFix : undefined,
});
