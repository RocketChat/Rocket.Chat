import { settings } from '../../app/settings/client';
import { useReactiveValue } from './useReactiveValue';

export const useSetting = (settingName) => useReactiveValue(() => settings.get(settingName), [settingName]);
