import React from 'react';

import { Markdown } from '../../../app/markdown/client';
import RawText from './RawText';

const MarkdownText = ({ children }) =>
	<RawText>{Markdown.parse(children)}</RawText>;

export default MarkdownText;
