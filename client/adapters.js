const { createTemplateForComponent } = require('./reactAdapters');

createTemplateForComponent('ThreadReply', () => import('./components/Message/Metrics/Thread'));
createTemplateForComponent('MessageActions', () => import('./components/Message/Actions'));
