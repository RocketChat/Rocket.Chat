import React, { FC } from 'react';

import BaseAvatar from '../../../avatar/BaseAvatar';

const AttachmentAuthorAvatar: FC<{ url: string }> = ({ url }) => <BaseAvatar {...({ url, size: 'x24' } as any)} />;

export default AttachmentAuthorAvatar;
