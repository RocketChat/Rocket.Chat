import React from 'react';

export const RawText = ({ children }) => <span dangerouslySetInnerHTML={{ __html: children }} />;
