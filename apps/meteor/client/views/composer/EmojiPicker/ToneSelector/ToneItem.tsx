import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const ToneItem = ({ tone }: { tone: number }) => {
	let toneColor;
	switch (tone) {
		case 1:
			toneColor = '#fae3c3';
			break;
		case 2:
			toneColor = '#e2cfa1';
			break;
		case 3:
			toneColor = '#dba373';
			break;
		case 4:
			toneColor = '#a88054';
			break;
		case 5:
			toneColor = '#5f4e43';
			break;
		default:
			toneColor = '#ffcf11';
			break;
	}

	const style = css`
		background-color: ${toneColor};
	`;

	return <Box width='20px' height='20px' borderRadius='full' className={style} />;
};

export default ToneItem;
