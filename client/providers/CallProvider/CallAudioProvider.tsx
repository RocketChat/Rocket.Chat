import React, { FC, useRef } from 'react';

import { CallAudioContext } from '../../contexts/CallAudioContext';

export const CallAudioProvider: FC = ({ children }) => {
	const remoteAudioMediaRef = useRef<HTMLAudioElement>(null);

	return <CallAudioContext.Provider value={{ value: remoteAudioMediaRef }}>{children}</CallAudioContext.Provider>;
};
