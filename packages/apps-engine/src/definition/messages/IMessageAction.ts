import type { MessageActionType } from './MessageActionType';
import type { MessageProcessingType } from './MessageProcessingType';

/**
 * Interface which represents an action which can be added to a message.
 */
export interface IMessageAction {
    type: MessageActionType;
    text?: string;
    url?: string;
    image_url?: string;
    is_webview?: boolean;
    webview_height_ratio?: string;
    msg?: string;
    msg_in_chat_window?: boolean;
    msg_processing_type?: MessageProcessingType;
}
