import { View, Text } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import StrikeSpan from './StrikeSpan';

type LinkSpanProps = {
	label: MessageParser.Markup | MessageParser.Markup[];
};

const LinkSpan = ({ label }: LinkSpanProps): ReactElement => {
	const children = useMemo(() => {
		const labelArray = Array.isArray(label) ? label : [label];

		const labelElements = labelArray.map((child, index) => {
			switch (child.type) {
				case 'PLAIN_TEXT':
					return <Text key={index}>{child.value.trim()}</Text>;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				default:
					return null;
			}
		});

		return labelElements;
	}, [label]);

	return <View>{children}</View>;
};

export default LinkSpan;
