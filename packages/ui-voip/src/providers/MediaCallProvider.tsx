import { AnchorPortal } from '@rocket.chat/ui-client';
import { useEndpoint, useUserAvatarPath, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

import { useMediaSessionInstance, useMediaSession } from './useMediaSession';
import useMediaStream from './useMediaStream';
import MediaCallContext from '../v2/MediaCallContext';
import MediaCallWidget from '../v2/MediaCallWidget';

const avatarUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAAAAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAgMREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6LxqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVrjbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRkeX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkBSuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlPUH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z`;
const myData: any[] = Array.from({ length: 100 }, (_, i) => ({ value: `user-${i}`, label: `User ${i}`, identifier: `000${i}`, avatarUrl }));

const MediaCallProvider = ({ children }: { children: React.ReactNode }) => {
	const userId = useUserId();

	const instance = useMediaSessionInstance(userId ?? undefined);
	// console.log('instance', instance);
	const session = useMediaSession(instance);

	const remoteStreamRefCallback = useMediaStream(instance);

	const onMute = () => session.toggleMute();
	const onHold = () => session.toggleHold();

	const onDeviceChange = (device: string) => {
		session.changeDevice(device);
	};

	const onForward = () => {
		console.log('forward');
		session.forwardCall();
	};

	const onTone = (tone: string) => {
		console.log('tone', tone);
		session.sendTone(tone);
	};

	const onEndCall = () => {
		console.log('end call');
		session.endCall();
	};

	const getAvatarPath = useUserAvatarPath();

	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
	const usersInfoEndpoint = useEndpoint('GET', '/v1/users.info');

	const getAutocompleteOptions = async (filter: string) => {
		const { items } = await usersAutoCompleteEndpoint({ selector: JSON.stringify({ term: filter, conditions: {} }) });
		return (
			items.map((user) => {
				const label = user.name || user.username;
				// TODO: This endpoint does not provide the extension number, which is necessary to show in the UI.
				const identifier = user.username !== label ? user.username : undefined;

				return {
					value: user._id,
					label,
					identifier,
					avatarUrl: getAvatarPath({ username: user.username, etag: user.avatarETag }),
				};
			}) || []
		);
	};

	const onCall = async (_id?: string, kind?: 'user' | 'sip') => {
		console.log('onCall', _id, kind);
		session.startCall(_id, kind || 'user');
	};

	const onToggleWidget = () => {
		session.toggleWidget();
	};

	const { data } = useQuery({
		queryKey: ['users.info', session.contact?.id],
		queryFn: async () => {
			const id = session.contact?.id;
			if (!id) {
				return;
			}

			const peerInfo = myData.find((item) => item.value === id);
			if (peerInfo) {
				return peerInfo;
			}

			const { user } = await usersInfoEndpoint({ userId: id });

			if (user) {
				return {
					name: user.name || user.username || '',
					avatarUrl: getAvatarPath({ username: user.username || '', etag: user.avatarETag }),
					identifier: user.freeSwitchExtension || '',
				};
			}

			throw new Error('User not found');
		},
		placeholderData: {
			name: session.contact?.displayName || '',
			avatarUrl: session.contact?.avatarUrl || '',
			identifier: session.contact?.sipExtension || '',
		},
		enabled: !!session.contact?.id,
	});

	const contextValue = {
		state: session.state,
		muted: session.muted,
		held: session.held,
		peerInfo: data,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onToggleWidget,
		getAutocompleteOptions,
		getPeerInfo: () => Promise.resolve(data),
	};

	return (
		<MediaCallContext.Provider value={contextValue}>
			{createPortal(
				<audio ref={remoteStreamRefCallback}>
					<track kind='captions' />
				</audio>,
				document.body,
			)}
			<AnchorPortal id='rcx-media-call-widget-portal'>
				<MediaCallWidget />
			</AnchorPortal>
			{children}
		</MediaCallContext.Provider>
	);
};

export default MediaCallProvider;
