import { createTemplateForComponent } from './reactAdapters';

createTemplateForComponent('reactAttachments', () => import('./components/Message/Attachments'));
createTemplateForComponent('ThreadReply', () => import('./components/Message/Metrics/Thread'));
