import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const AuthorName: FC<ComponentProps<typeof Box>> = (props) => <Box withTruncatedText fontScale='p2m' mi='x8' {...props} />;

export default AuthorName;
