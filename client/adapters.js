import { createTemplateForComponent } from './reactAdapters';

createTemplateForComponent('reactAttachment', () => import('./components/Message/Attachments'));
createTemplateForComponent('ThreadReply', () => import('./components/Message/Metrics/Thread'));