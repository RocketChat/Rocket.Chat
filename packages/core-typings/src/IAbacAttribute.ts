import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';

export const IAbacAttributeDefinitionSchema = z.object({
	key: z.string().regex(/^[A-Za-z0-9_-]+$/),
	values: z.array(z.string()).meta({ description: 'List of string values for this attribute key.' }),
});

export const IAbacAttributeSchema = IRocketChatRecordSchema.and(IAbacAttributeDefinitionSchema);

export interface IAbacAttributeDefinition extends z.infer<typeof IAbacAttributeDefinitionSchema> {}
export interface IAbacAttribute extends z.infer<typeof IAbacAttributeSchema> {}
