/** The fields of a JSON request body, read defensively: anything that is not an object has none. */
export type Fields = Record<string, unknown>;

export const fieldsOf = (value: unknown): Fields => (value && typeof value === 'object' ? value : {}) as Fields;

/** Whether every named field is a non-empty string, which is what lk-jwt-service accepts as present. */
export const hasText = (fields: Fields, ...names: string[]): boolean =>
	names.every((name) => typeof fields[name] === 'string' && fields[name] !== '');
