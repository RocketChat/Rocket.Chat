/** Whether a value can name an app: letters, digits, `_` and `-` only, so it can never change the path it is placed in. */
export const isValidAppId = (appId: unknown): appId is string => typeof appId === 'string' && /^[A-Za-z0-9_-]+$/.test(appId);
