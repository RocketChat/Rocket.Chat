import { UserStatus } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MediaCallContext from './MediaCallContext';
import type { State, PeerInfo } from './MediaCallContext';

const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;
const myData: any[] = Array.from({ length: 100 }, (_, i) => ({ value: `user-${i}`, label: `User ${i}`, identifier: `000${i}`, avatarUrl }));

type MockedMediaCallProviderProps = {
	children: ReactNode;
	state?: State;
	transferredBy?: string;
	remoteMuted?: boolean;
	remoteHeld?: boolean;
	muted?: boolean;
	held?: boolean;
};

const MockedMediaCallProvider = ({
	children,
	state = 'closed',
	transferredBy = undefined,
	remoteMuted = false,
	remoteHeld = false,
	muted = false,
	held = false,
}: MockedMediaCallProviderProps) => {
	const [peerInfo, setPeerInfo] = useState<PeerInfo | undefined>({
		displayName: 'John Doe',
		userId: '1234567890',
		avatarUrl,
		username: 'john.doe',
		callerId: '1234567890',
		status: UserStatus.ONLINE,
	});
	const [widgetState, setWidgetState] = useState<State>(state);
	const [mutedState, setMutedState] = useState(muted);
	const [heldState, setHeldState] = useState(held);

	const onMute = () => setMutedState((prev) => !prev);
	const onHold = () => setHeldState((prev) => !prev);

	const clearState = () => {
		setMutedState(false);
		setHeldState(false);
	};

	const onDeviceChange = (device: any) => {
		console.log('device', device);
	};

	const onForward = () => {
		console.log('forward');
		clearState();
		setWidgetState('closed');
	};

	const onTone = (tone: string) => {
		console.log('tone', tone);
	};

	const onEndCall = () => {
		clearState();
		setWidgetState('closed');
	};

	const getAutocompleteOptions = (filter: string) =>
		Promise.resolve(myData.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase())));

	const getPeerInfo = (id: string) => {
		const peerInfo = myData.find((item) => item.value === id);
		if (!peerInfo) {
			return Promise.resolve(undefined);
		}

		return Promise.resolve({
			displayName: peerInfo.label,
			userId: peerInfo.value,
			avatarUrl: peerInfo.avatarUrl,
			username: peerInfo.identifier,
			callerId: peerInfo.value,
		});
	};

	const onCall = async (id?: string) => {
		if (id) {
			setPeerInfo(await getPeerInfo(id));
		}

		switch (widgetState) {
			case 'closed':
				setWidgetState('ringing');
				break;
			case 'ringing':
				setWidgetState('ongoing');
				break;
			case 'new':
				setWidgetState('calling');
				setTimeout(() => {
					setWidgetState('ongoing');
				}, 1000);
				break;
			case 'calling':
				setWidgetState('closed');
				break;
		}
	};

	const onToggleWidget = () => {
		switch (widgetState) {
			case 'closed':
				setWidgetState('new');
				break;
			case 'new':
				setWidgetState('closed');
				break;
		}
	};

	const onSelectPeer = (peerInfo: PeerInfo) => {
		setPeerInfo(peerInfo);
	};

	const contextValue = {
		state: widgetState,
		hidden: false,
		connectionState: 'CONNECTED' as const,
		peerInfo,
		transferredBy,
		muted: mutedState,
		held: heldState,
		remoteMuted,
		remoteHeld,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onAccept: onCall,
		onToggleWidget,
		onSelectPeer,
		getAutocompleteOptions,
		getPeerInfo,
	};

	return <MediaCallContext.Provider value={contextValue}>{children}</MediaCallContext.Provider>;
};

export default MockedMediaCallProvider;
