const { createTemplateForComponent } = require('./reactAdapters');

createTemplateForComponent('ThreadReply', () => import('./components/Message/Metrics/Thread'));
