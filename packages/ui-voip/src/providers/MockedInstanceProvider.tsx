import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import useAvailableViewTracker from './useAvailableViewTracker';
import { useInstanceState } from './useInstanceState';
import { MediaCallInstanceContext } from '../context/MediaCallInstanceContext';
import type { MediaCallInstanceContextValue } from '../context/MediaCallInstanceContext';
import { defaultSessionState } from '../context/MediaCallViewContext';
import type { SessionState } from '../context/definitions';

export const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;

export const mockedPeers = Array.from({ length: 100 }, (_, i) => ({
	value: `user-${i}`,
	label: `User ${i}`,
	identifier: `000${i}`,
	avatarUrl,
}));

export type MockedInstanceProviderProps = {
	children: ReactNode;
	sessionState?: SessionState;
} & Partial<MediaCallInstanceContextValue>;

const MockedInstanceProvider = ({ children, sessionState = defaultSessionState, ...props }: MockedInstanceProviderProps) => {
	const { currentViews, registerView, unregisterView } = useAvailableViewTracker();
	const [instance] = useState(
		() =>
			({
				getState: () => null,
				on: () => () => undefined,
				once: () => () => undefined,
			}) as unknown as MediaSignalingSession,
	);

	const sessionStateRef = useRef(sessionState);
	sessionStateRef.current = sessionState;

	const { openWidget, closeWidget, targetPeer, setTargetPeer, targetWidgetVisibility, openRoomId, setOpenRoomId } =
		useInstanceState(instance);

	const getAutocompleteOptions = useCallback(
		(filter: string) => Promise.resolve(mockedPeers.filter((peer) => peer.label.toLowerCase().includes(filter.toLowerCase()))),
		[],
	);

	const value = {
		instance,
		audioElement: undefined,
		openRoomId,
		setOpenRoomId,
		currentViews,
		registerView,
		unregisterView,
		targetWidgetVisibility,
		targetPeer,
		setTargetPeer,
		getAutocompleteOptions,
		openWidget,
		closeWidget,
		...props,
	};

	return <MediaCallInstanceContext.Provider value={value}>{children}</MediaCallInstanceContext.Provider>;
};

export default MockedInstanceProvider;
