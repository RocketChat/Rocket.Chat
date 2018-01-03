/* globals isFirefox */

const baseUrl = isFirefox && isFirefox[1] < 55 ? () => `${ window.location.origin }${ FlowRouter.current().path }` : () => '';

Template.icon.helpers({ baseUrl });
