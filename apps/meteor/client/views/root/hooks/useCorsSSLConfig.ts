import { useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

export const useCorsSSLConfig = () => {
	const forceSSlSetting = useSetting('Force_SSL');

	useEffect(() => {
		Meteor.absoluteUrl.defaultOptions.secure = Boolean(forceSSlSetting);
	}, [forceSSlSetting]);
};
