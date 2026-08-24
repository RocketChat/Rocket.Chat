import type { ISetting } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';

const schemas = new Map<ISetting['_id'], ReturnType<typeof ajv.compile>>();

export const registerSettingSchema = (_id: ISetting['_id'], schema: Record<string, unknown>): void => {
	schemas.set(_id, ajv.compile(schema));
};

export const getSettingSchemaValidator = (_id: ISetting['_id']): ReturnType<typeof ajv.compile> | undefined => schemas.get(_id);
