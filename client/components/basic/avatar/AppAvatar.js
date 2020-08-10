import React from 'react';

import BaseAvatar from './BaseAvatar';

const objectFit = { objectFit: 'contain' };

export default function AppAvatar({ iconFileContent, iconFileData, ...props }) {
	return <BaseAvatar style={objectFit} url={iconFileContent || `data:image/png;base64,${ iconFileData }`} {...props}/>;
}
