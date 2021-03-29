import { Divider } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const HeaderDivider: FC = () => <Divider {...({ mbs: 'neg-x2', mbe: 0 } as any)} />;

export default HeaderDivider;
