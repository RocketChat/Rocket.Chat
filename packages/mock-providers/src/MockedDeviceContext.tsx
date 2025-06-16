import type { DeviceContextValue } from '@rocket.chat/ui-contexts';
import { DeviceContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

const mockDeviceContextValue: DeviceContextValue = {
	enabled: true,
	selectedAudioOutputDevice: undefined,
	selectedAudioInputDevice: undefined,
	availableAudioOutputDevices: [],
	availableAudioInputDevices: [],
	setAudioOutputDevice: () => undefined,
	setAudioInputDevice: () => undefined,
};

type MockedDeviceContextProps = Partial<DeviceContextValue> & {
	children: ReactNode;
};

export const MockedDeviceContext = ({ children, ...props }: MockedDeviceContextProps) => {
	return <DeviceContext.Provider value={{ ...mockDeviceContextValue, ...props }}>{children}</DeviceContext.Provider>;
};
