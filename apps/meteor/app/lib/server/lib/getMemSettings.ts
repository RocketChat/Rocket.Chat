import { Settings } from '@rocket.chat/models';
import mem from 'mem';

export const getSettingCached = mem(Settings.getValueById, { maxAge: 10000 });
