import { overrideGenerator } from './overrideGenerator';

export const overwriteSetting = overrideGenerator((key: string) => process.env[`OVERWRITE_SETTING_${key}`]);
