import { Plain as ASTPlain } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

const Plain: FC<{ value: ASTPlain }> = ({ value }) => <>{value.type === 'PLAIN_TEXT' && value.value}</>;

export default memo(Plain);
