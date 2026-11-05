import { useContext } from 'react';

import { DeviceContext } from '../DeviceContext.js';

export const useIsDeviceManagementEnabled = (): boolean => useContext(DeviceContext).enabled;
