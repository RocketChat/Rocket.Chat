import { overrideGenerator } from './overrideGenerator';

export const overrideSetting = overrideGenerator((key: string) => process.env[key]);
