import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { encrypt, getKeyFromString } from '../../../app/livechat/client/externalFrame/crypto';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useRoom } from '../room/contexts/RoomContext';

function ExternalFrameContainer() {
	const uid = useUserId();
	const room = useRoom();
	const { 'X-Auth-Token': authToken } = sdk.rest.getCredentials() || {};
	const keyStr = useSetting('Omnichannel_External_Frame_Encryption_JWK', '');
	const frameURLSetting = useSetting('Omnichannel_External_Frame_URL', '');

	const token = useQuery({
		queryKey: ['externalFrame', keyStr, authToken],

		queryFn: async () => {
			if (!keyStr || !authToken) {
				return '';
			}
			return encrypt(authToken, await getKeyFromString(keyStr));
		},
	});

	const externalFrameUrl = useMemo(() => {
		if (!frameURLSetting || !uid || !room._id || !authToken || !token.data) {
			return '';
		}
		const frameURL = new URL(frameURLSetting);

		frameURL.searchParams.append('uid', uid);
		frameURL.searchParams.append('rid', room._id);
		frameURL.searchParams.append('t', authToken);

		return frameURL.toString();
	}, [frameURLSetting, uid, room._id, authToken, token.data]);

	if (!externalFrameUrl) {
		return null;
	}

	return (
		<div className='flex-nav'>
			<iframe style={{ width: '100%', height: '100%' }} title='external-frame' src={externalFrameUrl} />
		</div>
	);
}

export default ExternalFrameContainer;
