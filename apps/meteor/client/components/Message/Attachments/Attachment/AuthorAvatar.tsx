import React, { FC } from 'react';

import BaseAvatar from '../../../avatar/BaseAvatar';

const AuthorAvatar: FC<{ url: string }> = ({ url }) => <BaseAvatar {...({ url, size: 'x24' } as any)} />;

export default AuthorAvatar;
