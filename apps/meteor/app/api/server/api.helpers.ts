import type { IUser } from '@rocket.chat/core-typings';

import { hasAllPermissionAsync, hasAtLeastOnePermissionAsync } from '../../authorization/server/functions/hasPermission';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | '*';
export type PermissionsPayload = {
	[key in RequestMethod]?: {
		operation: 'hasAll' | 'hasAny';
		permissions: string[];
	};
};

export type PermissionsPayloadLight = {
	[key in RequestMethod]?: string[];
};

export type PermissionsRequiredKey = string[] | PermissionsPayload | PermissionsPayloadLight;

const isLegacyPermissionsPayload = (permissionsPayload: PermissionsRequiredKey): permissionsPayload is string[] => {
	return Array.isArray(permissionsPayload);
};

const isLightPermissionsPayload = (permissionsPayload: PermissionsRequiredKey): permissionsPayload is PermissionsPayloadLight => {
	return (
		typeof permissionsPayload === 'object' &&
		Object.keys(permissionsPayload).some((key) => ['GET', 'POST', 'PUT', 'DELETE', '*'].includes(key.toUpperCase())) &&
		Object.values(permissionsPayload).every((value) => Array.isArray(value))
	);
};

const isPermissionsPayload = (permissionsPayload: PermissionsRequiredKey): permissionsPayload is PermissionsPayload => {
	return (
		typeof permissionsPayload === 'object' &&
		Object.keys(permissionsPayload).some((key) => ['GET', 'POST', 'PUT', 'DELETE', '*'].includes(key.toUpperCase())) &&
		Object.values(permissionsPayload).every((value) => typeof value === 'object' && value.operation && value.permissions)
	);
};

export async function checkPermissionsForInvocation(
	userId: IUser['_id'],
	permissionsPayload: PermissionsPayload,
	requestMethod: RequestMethod,
): Promise<boolean> {
	const permissions = permissionsPayload[requestMethod] || permissionsPayload['*'];

	if (!permissions) {
		// how we reached here in the first place?
		return false;
	}

	if (permissions.permissions.length === 0) {
		// You can pass an empty array of permissions to allow access to the method
		return true;
	}

	if (permissions.operation === 'hasAll') {
		return hasAllPermissionAsync(userId, permissions.permissions);
	}

	if (permissions.operation === 'hasAny') {
		return hasAtLeastOnePermissionAsync(userId, permissions.permissions);
	}

	return false;
}

// We'll assume options only contains permissionsRequired, as we don't care of the other elements
export function checkPermissions(options: { permissionsRequired: PermissionsRequiredKey }) {
	if (!options.permissionsRequired) {
		return false;
	}

	if (isPermissionsPayload(options.permissionsRequired)) {
		// No modifications needed
		return true;
	}

	if (isLegacyPermissionsPayload(options.permissionsRequired)) {
		options.permissionsRequired = {
			'*': {
				operation: 'hasAll',
				permissions: options.permissionsRequired,
			},
		};
		return true;
	}

	if (isLightPermissionsPayload(options.permissionsRequired)) {
		Object.keys(options.permissionsRequired).forEach((method) => {
			const methodKey = method as RequestMethod;
			// @ts-expect-error -- we know the type of the value but ts refuses to infer it
			options.permissionsRequired[methodKey] = {
				operation: 'hasAll',
				// @ts-expect-error -- we know the type of the value but ts refuses to infer it
				permissions: options.permissionsRequired[methodKey],
			};
		});
		return true;
	}

	// If reached here, options.permissionsRequired contained an invalid payload
	return false;
}
