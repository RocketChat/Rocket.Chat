/* globals isFirefox */

const firefoxBaseUrlFix = () => `${ window.location.origin }${ FlowRouter.current().path }`;

Template.icon.helpers({
	baseUrl: isFirefox && isFirefox[1] < 55 ? firefoxBaseUrlFix : undefined
});
