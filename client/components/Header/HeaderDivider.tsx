import { Divider, DividerProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type HeaderDividerProps = DividerProps;

const HeaderDivider: FC<HeaderDividerProps> = () => <Divider mbs={-2} mbe={0} />;

export default HeaderDivider;
