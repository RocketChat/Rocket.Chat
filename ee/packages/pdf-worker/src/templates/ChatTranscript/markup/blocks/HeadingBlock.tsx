import { View } from '@react-pdf/renderer';
import { fontScale } from '@rocket.chat/fuselage-tokens/dist/typography.json';
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

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
