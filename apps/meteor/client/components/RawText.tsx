import React, { ReactElement } from 'react';

// @deprecated
const RawText = ({ children }: { children: string }): ReactElement => <span dangerouslySetInnerHTML={{ __html: children }} />;

export default RawText;
