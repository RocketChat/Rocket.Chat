import React from 'react';

// @deprecated
const RawText = ({ children }) => <span dangerouslySetInnerHTML={{ __html: children }} />;

export default RawText;
