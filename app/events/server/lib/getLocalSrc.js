import { settings } from '../../../settings/server';

export const getLocalSrc = () => settings.get('Site_Url').replace('http', '').replace('https', '').replace('://', '').split(':')[0];
