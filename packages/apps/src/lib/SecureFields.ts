export type SecureFieldDescriptor<T extends Record<string, unknown>, K extends keyof T> = {
	permission: string;
	name: K;
	value: T[K];
};

export const kSecureFields = '@@SecureFields';

export type WithSecureFields<T extends Record<string, unknown>> = T & { [kSecureFields]: SecureFieldDescriptor<T, keyof T>[] };

export function secureFieldsMapper<T extends Record<string, unknown>>(
	mapper: (object: T) => SecureFieldDescriptor<T, keyof T>[] | undefined,
) {
	return { [kSecureFields]: mapper };
}

export function hasSecureFields(object: unknown): boolean {
	return !!object?.[kSecureFields];
}
