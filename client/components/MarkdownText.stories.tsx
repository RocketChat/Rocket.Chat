import { Story } from '@storybook/react';
import React from 'react';

import MarkdownText from './MarkdownText';

export default {
	title: 'components/MarkdownText',
	component: MarkdownText,
};

export const Example: Story = () => (
	<MarkdownText
		content={`
# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading

___

*This is bold text*

_This is italic text_

~Strikethrough~

+ Lorem ipsum dolor sit amet
+ Consectetur adipiscing elit
+ Integer molestie lorem at massa

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

\`rocket.chat();\`

https://rocket.chat`}
	/>
);
