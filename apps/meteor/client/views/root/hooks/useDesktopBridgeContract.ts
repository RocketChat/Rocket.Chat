import { useEffect } from 'react';

import { Info } from '../../../../rocketchat.info';
import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/** Tells the desktop app that this web client pushes the bridge contract's values, starting with the server build it runs. */
export const useDesktopBridgeContract = () => {
	useEffect(() => {
		callDesktopBridge((desktop) => desktop.setWebClientBridgeVersion?.(1));
		callDesktopBridge((desktop) => desktop.setServerInfo(Info));

		const gitCommitHash = Info.commit?.hash;
		if (gitCommitHash) {
			callDesktopBridge((desktop) => desktop.setGitCommitHash(gitCommitHash));
		}
	}, []);
};
