import { settings } from '../../../settings/server';

export const getLocalSrc = (): string => settings.get('Site_Url').replace('http', '').replace('https', '').replace('://', '').split(':')[0];
