/* globals isFirefox */

const baseUrl = isFirefox ? () => { FlowRouter.watchPathChange(); return `${ window.location.origin }${ FlowRouter.current().path }`; } : () => '';

Template.icon.helpers({ baseUrl });
