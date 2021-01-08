const { createTemplateForComponent } = require('./reactAdapters');

createTemplateForComponent('ThreadMetric', () => import('./components/Message/Metrics/Thread'));
createTemplateForComponent('DiscussionMetric', () => import('./components/Message/Metrics/Discussion'));
createTemplateForComponent('BroadCastMetric', () => import('./components/Message/Metrics/Broadcast'));
