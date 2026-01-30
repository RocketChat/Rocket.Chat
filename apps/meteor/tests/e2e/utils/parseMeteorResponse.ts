import type { APIResponse } from '@playwright/test';
import type { Serialized } from '@rocket.chat/core-typings';

export const parseMeteorResponse = async <ResponseType = unknown>(response: APIResponse): Promise<Serialized<ResponseType>> => {
	const { message, success } = await response.json();

	if (!success) {
		throw new Error(message);
	}

	const { result, error } = JSON.parse(message);

	if (error) {
		throw new Error(JSON.stringify(error));
	}

	return result;
};
