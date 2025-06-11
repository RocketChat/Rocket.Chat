import type { MessageFormSubmitPayload } from './MessageForm';
import type { RecipientFormSubmitPayload } from './RecipientForm';

export { default as RecipientForm } from './RecipientForm';
export { default as MessageForm } from './MessageForm';

export type SubmitPayload = RecipientFormSubmitPayload & MessageFormSubmitPayload;
