import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

const objectFit = { objectFit: 'contain' };

export default function AppAvatar({ iconFileContent, iconFileData, ...props }) {
	return <Avatar style={objectFit} url={iconFileContent || `data:image/png;base64,${ iconFileData }`} {...props}/>;
}
