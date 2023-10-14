import { Box, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

const TimeRangeInput = ({ onChange, start: startDefault, finish: finishDefault }) => {
	const t = useTranslation();

	const [start, setStart] = useState(startDefault);
	const [finish, setFinish] = useState(finishDefault);

	const handleChangeFrom = useMutableCallback(({ currentTarget: { value } }) => {
		setStart(value);
		onChange(value, finish);
	});

	const handleChangeTo = useMutableCallback(({ currentTarget: { value } }) => {
		setFinish(value);
		onChange(start, value);
	});

	return (
		<>
			<Box display='flex' flexDirection='column' flexGrow={1} mie={2}>
				{t('Open')}:
				<InputBox type='time' value={start} onChange={handleChangeFrom} />
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} mis={2}>
				{t('Close')}:
				<InputBox type='time' value={finish} onChange={handleChangeTo} />
			</Box>
		</>
	);
};

export default TimeRangeInput;
