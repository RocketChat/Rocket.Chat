import { Text, View } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';
import type * as MessageParser from '@rocket.chat/message-parser';

type HeadingBlockProps = {
	items?: MessageParser.Plain[];
	level?: 1 | 2 | 3 | 4;
};

const Header = ({ items = [], level = 1 }: HeadingBlockProps) => (
	<View style={{ fontSize: fontScales[`h${level}`].fontSize, fontWeight: fontScales[`h${level}`].fontWeight }}>
		{items.map((block, index) => (
			<Text key={index}>{block.value}</Text>
		))}
	</View>
);

export default Header;
