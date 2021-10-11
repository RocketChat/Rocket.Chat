import { callbacks } from '../../../../../lib/callbacks';
import { handleMessagesSent, handleMessagesDeleted } from '../lib/messages';

callbacks.add('afterSaveMessage', handleMessagesSent);
callbacks.add('afterDeleteMessage', handleMessagesDeleted);
