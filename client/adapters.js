const { createTemplateForComponent } = require('./reactAdapters');

createTemplateForComponent('MessageActions', () => import('./components/Message/Actions'));
createTemplateForComponent('ThreadMetric', () => import('./components/Message/Metrics/Thread'));
createTemplateForComponent('DiscussionMetric', () => import('./components/Message/Metrics/Discussion'));
createTemplateForComponent('BroadCastMetric', () => import('./components/Message/Metrics/Broadcast'));
