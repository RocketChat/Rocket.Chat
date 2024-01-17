import { IconButton, useCursor, PositionAnimated, Options } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useMemo, useRef, useCallback, useEffect } from 'react';

import ToneItem from './ToneItem';

const ToneSelector = ({ tone, setTone }: { tone: number; setTone: (tone: number) => void }) => {
	const options = useMemo(() => {
		const renderOption = (tone: number): ReactElement => <ToneItem tone={tone} />;

		const statuses: Array<[value: number, label: ReactElement, selected: boolean]> = [
			[0, renderOption(0), tone === 0],
			[1, renderOption(1), tone === 1],
			[2, renderOption(2), tone === 2],
			[3, renderOption(3), tone === 3],
			[4, renderOption(4), tone === 4],
			[5, renderOption(5), tone === 5],
		];

		return statuses;
	}, [tone]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setTone(selected);
		reset();
		hide();
	});

	const ref = useRef<HTMLButtonElement>(null);
	const onClick = useCallback(() => {
		if (!ref?.current) {
			return;
		}
		ref.current.focus();
		show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(
		([selected]) => {
			setTone(selected);
			reset();
			hide();
		},
		[hide, reset, setTone],
	);

	useEffect(() => setTone(tone), [tone, setTone]);

	return (
		<>
			<IconButton
				medium
				ref={ref}
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				mis={4}
				icon={<ToneItem tone={tone} />}
			/>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement='left-middle'>
				<Options onSelect={handleSelection} options={options} cursor={cursor} />
			</PositionAnimated>
		</>
	);
};

export default ToneSelector;
