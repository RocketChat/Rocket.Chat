import React from 'react';

const RawText = ({ children }) => <span dangerouslySetInnerHTML={{ __html: children }} />;

export default RawText;
