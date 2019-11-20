import React from 'react';

import { Markdown } from '../../../app/markdown/client';

export const MarkdownText = ({ children }) => <span dangerouslySetInnerHTML={{ __html: Markdown.parseNotEscaped(children) }} />;
