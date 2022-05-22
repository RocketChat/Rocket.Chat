import { CodeLine as ASTCodeLine } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

const CodeLine: FC<{ value: ASTCodeLine['value'] }> = ({ value }) => <div>{value.type === 'PLAIN_TEXT' && value.value}</div>;

export default CodeLine;
