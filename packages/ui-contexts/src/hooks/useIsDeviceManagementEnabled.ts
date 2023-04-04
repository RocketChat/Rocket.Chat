import { useContext } from 'react';

import { DeviceContext } from '../DeviceContext';

export const useIsDeviceManagementEnabled = (): boolean => useContext(DeviceContext).enabled;
