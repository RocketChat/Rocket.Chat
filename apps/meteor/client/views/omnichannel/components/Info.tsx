import { css } from '@rocket.chat/css-in-js';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

import { UserCardInfo } from '../../../components/UserCard';

const wordBreak = css`
	word-break: break-word;
`;

type InfoProps = { className?: string; style?: CSSProperties; children?: ReactNode };

const Info = ({ className, ...props }: InfoProps) => <UserCardInfo className={[className, wordBreak]} flexShrink={0} {...props} />;

export default Info;
