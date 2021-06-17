import { callbacks } from '../../../../../server/utils/hooks';
import { handleMessagesSent, handleMessagesDeleted } from '../lib/messages';

callbacks.add('afterSaveMessage', handleMessagesSent);
callbacks.add('afterDeleteMessage', handleMessagesDeleted);
