import type { MessageFormSubmitPayload } from './MessageForm';
import type { RecipientFormSubmitPayload } from './RecipientForm';
import type { RepliesFormSubmitPayload } from './RepliesForm';

export type SubmitPayload = RecipientFormSubmitPayload & MessageFormSubmitPayload & RepliesFormSubmitPayload;

export { default as RecipientForm } from './RecipientForm';
export { default as MessageForm } from './MessageForm';
export { default as RepliesForm } from './RepliesForm';
