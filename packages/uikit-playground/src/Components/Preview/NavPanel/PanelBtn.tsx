import { css } from '@rocket.chat/css-in-js';
import { Button, Label } from '@rocket.chat/fuselage';
import type { FC, ReactNode } from 'react';
import { useState } from 'react';

const PanelBtn: FC<{ icon: ReactNode; name: string; isSmall: boolean }> = ({ icon, name, isSmall }) => {
	const [hover, setHover] = useState(false);

	const style = css`
		width: ${hover ? '100%' : '0px'};
		white-space: nowrap;
		transition: 0.3s ease;
	`;

	return isSmall ? (
		<>
			<Button tiny square onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
				{icon}
			</Button>
			<Label overflow={'hidden'} className={style} fontScale='micro'>
				{name}
			</Label>
		</>
	) : (
		<Button>{name}</Button>
	);
};

export default PanelBtn;
