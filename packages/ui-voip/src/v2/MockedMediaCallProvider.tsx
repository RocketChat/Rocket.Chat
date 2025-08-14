import { useState } from 'react';

import MediaCallContext from './MediaCallContext';
import type { State, PeerInfo } from './MediaCallContext';

const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;
const myData: any[] = Array.from({ length: 100 }, (_, i) => ({ value: `user-${i}`, label: `User ${i}`, identifier: `000${i}`, avatarUrl }));

const MediaCallProviderMock = ({ children, state = 'closed' }: { children: React.ReactNode; state?: State }) => {
	const [peerInfo, setPeerInfo] = useState<PeerInfo | undefined>({
		name: 'John Doe',
		avatarUrl,
		identifier: '1234567890',
	});
	const [widgetState, setWidgetState] = useState<State>(state);
	const [muted, setMuted] = useState(false);
	const [held, setHeld] = useState(false);

	const onMute = () => setMuted((prev) => !prev);
	const onHold = () => setHeld((prev) => !prev);

	const clearState = () => {
		setMuted(false);
		setHeld(false);
	};

	const onDeviceChange = (device: string) => {
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
			name: peerInfo.label,
			avatarUrl: peerInfo.avatarUrl,
			identifier: peerInfo.value,
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

	const contextValue = {
		state: widgetState,
		peerInfo,
		muted,
		held,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onToggleWidget,
		getAutocompleteOptions,
		getPeerInfo,
	};

	return <MediaCallContext.Provider value={contextValue}>{children}</MediaCallContext.Provider>;
};

export default MediaCallProviderMock;
