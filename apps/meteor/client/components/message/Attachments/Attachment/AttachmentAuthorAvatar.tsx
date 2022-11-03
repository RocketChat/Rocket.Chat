import React, { ReactElement } from 'react';

import BaseAvatar from '../../../avatar/BaseAvatar';

const AttachmentAuthorAvatar = ({ url }: { url: string }): ReactElement => <BaseAvatar url={url} size='x24' />;

export default AttachmentAuthorAvatar;
