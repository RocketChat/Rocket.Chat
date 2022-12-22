import type { ReactElement } from 'react';
import React from 'react';

// @deprecated
const RawText = ({ children }: { children: string }): ReactElement => <span dangerouslySetInnerHTML={{ __html: children }} />;

export default RawText;
