import { View } from '@react-pdf/renderer';
import typography from '@rocket.chat/fuselage-tokens/dist/typography.json' with { type: 'json' };
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements.js';

const { fontScale } = typography;

type HeadingBlockProps = {
	items?: MessageParser.Inlines[];
	level?: 1 | 2 | 3 | 4;
};

const Header = ({ items = [], level = 1 }: HeadingBlockProps) => (
	<View style={{ fontSize: fontScale[`h${level}`].fontSize, fontWeight: fontScale[`h${level}`].fontWeight }}>
		<InlineElements>{items}</InlineElements>
	</View>
);

export default Header;
