import { useEffect, useState } from 'react';

type osTypes = |'macos'|'windows'|'linux'|'';

function getOsPlatform(): osTypes {
	const { platform } = window.navigator;

	const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];

	if (macosPlatforms.indexOf(platform) !== -1) {
		return 'macos';
	} if (windowsPlatforms.indexOf(platform) !== -1) {
		return 'windows';
	} if (/Linux/.test(platform)) {
		return 'linux';
	}
	return '';
}


export default function useOsPlatform(): osTypes {
	const [osPlatform, setOsPlatform] = useState<osTypes>('');

	useEffect(() => {
		const plat = getOsPlatform();
		setOsPlatform(plat);
	}, []);

	return osPlatform;
}
