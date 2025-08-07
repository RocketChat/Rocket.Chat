import { clientMediaSignalSchema, type ClientMediaSignal } from '@rocket.chat/media-signaling';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({ discriminator: true });

const schema: JSONSchemaType<ClientMediaSignal> = clientMediaSignalSchema;

export const isClientMediaSignal = ajv.compile(schema);
