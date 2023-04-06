import { Button, useCursor, PositionAnimated, Options } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useMemo, useRef, useCallback, useEffect } from 'react';

import ToneItem from './ToneItem';

const ToneSelector = ({ tone, setTone }: { tone: number; setTone: (tone: number) => void }) => {
	const options = useMemo(() => {
		const renderOption = (tone: number): ReactElement => <ToneItem tone={tone} />;

		const statuses: Array<[value: number, label: ReactElement]> = [
			[0, renderOption(0)],
			[1, renderOption(1)],
			[2, renderOption(2)],
			[3, renderOption(3)],
			[4, renderOption(4)],
			[5, renderOption(5)],
		];

		return statuses;
	}, []);

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
			<Button ref={ref} small square secondary onClick={onClick} onBlur={hide} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} mis='x8'>
				<ToneItem tone={tone} />
			</Button>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement='bottom-end'>
				<Options onSelect={handleSelection} options={options} cursor={cursor} />
			</PositionAnimated>

			{/* <div className='change-tone'>
				<a href='#change-tone'>
					<span className={`current-tone ${currentTone}`}></span>
				</a>
				<ul className='tone-selector secondary-background-color'>
					<li>
						<a href='#tone' className='tone' data-tone='0'>
							<span className='tone-0'></span>
						</a>
					</li>
					<li>
						<a href='#tone' className='tone' data-tone='1'>
							<span className='tone-1'></span>
						</a>
					</li>
					<li>
						<a href='#tone' className='tone' data-tone='2'>
							<span className='tone-2'></span>
						</a>
					</li>
					<li>
						<a href='#tone' className='tone' data-tone='3'>
							<span className='tone-3'></span>
						</a>
					</li>
					<li>
						<a href='#tone' className='tone' data-tone='4'>
							<span className='tone-4'></span>
						</a>
					</li>
					<li>
						<a href='#tone' className='tone' data-tone='5'>
							<span className='tone-5'></span>
						</a>
					</li>
				</ul>
			</div> */}
		</>
	);
};

export default ToneSelector;
