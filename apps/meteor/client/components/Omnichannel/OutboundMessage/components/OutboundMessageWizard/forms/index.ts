import type { MessageFormSubmitPayload } from './MessageForm';
import type { RecipientFormSubmitPayload } from './RecipientForm';

export type SubmitPayload = RecipientFormSubmitPayload & MessageFormSubmitPayload;
