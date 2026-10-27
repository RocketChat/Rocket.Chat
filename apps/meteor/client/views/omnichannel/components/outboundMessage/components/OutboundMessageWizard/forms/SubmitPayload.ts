import type { MessageFormSubmitPayload } from './MessageForm';
import type { RecipientFormSubmitPayload } from './RecipientForm';
import type { RepliesFormSubmitPayload } from './RepliesForm';

export type SubmitPayload = RecipientFormSubmitPayload & MessageFormSubmitPayload & RepliesFormSubmitPayload;
