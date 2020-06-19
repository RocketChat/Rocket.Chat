import { callbacks } from '../../../../../app/callbacks/server';
import { handleMessagesSent, handleMessagesDeleted } from '../lib/messages';

callbacks.add('afterSaveMessage', handleMessagesSent);
callbacks.add('afterDeleteMessage', handleMessagesDeleted);
