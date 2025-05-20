import { callbacks } from '../../lib/callbacks';
import { renderTimestamp } from '../lib/utils/timestamp/renderer';
import type { IMessageWithHTML } from '../lib/utils/timestamp/types';

callbacks.add(
    'renderMessage',
    (message: IMessageWithHTML): IMessageWithHTML => {
        if (message.html) {
            message.html = renderTimestamp(message.html);
        }
        return message;
    },
    callbacks.priority.HIGH,
    'timestamp'
);