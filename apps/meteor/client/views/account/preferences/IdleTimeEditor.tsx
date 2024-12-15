import { NumberInput, FieldRow, FieldLabel } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type IdleTimeEditorProps = {
	onChangeTime: (time: number | undefined) => void;
};

const IdleTimeEditor = ({ onChangeTime }: IdleTimeEditorProps) => {
	const { t } = useTranslation();
	const [hours, setHours] = useState<number>(0);
	const [minutes, setMinutes] = useState<number>(5);
	const [seconds, setSeconds] = useState<number>(0);
	const [finalSecondCount, setFinalSecondCount] = useState<number | undefined>(hours * 3600 + minutes * 60 + seconds);

	const idleTimeLimitHrs = useUniqueId();
	const idleTimeLimitMin = useUniqueId();
	const idleTimeLimitSec = useUniqueId();

	function handleHours(e: any) {
		setHours(Number(e.target.value));
	}

	function handleMinutes(e: any) {
		setMinutes(Number(e.target.value));
	}

	function handleSeconds(e: any) {
		setSeconds(Number(e.target.value));
	}

	useEffect(() => {
		handleFinalSecondCount();
	}, [hours, minutes, seconds]);

	function handleFinalSecondCount() {
		setFinalSecondCount(hours * 3600 + minutes * 60 + seconds);
		onChangeTime(finalSecondCount);
	}

	return (
		<FieldRow>
			<FieldLabel htmlFor={idleTimeLimitHrs}>{t('Hours')}</FieldLabel>
			<NumberInput value={hours} onChange={handleHours} id={idleTimeLimitHrs} />
			<FieldLabel htmlFor={idleTimeLimitMin}>{t('minutes')}</FieldLabel>
			<NumberInput value={minutes} onChange={handleMinutes} id={idleTimeLimitMin} max={59} min={0} />
			<FieldLabel htmlFor={idleTimeLimitSec}>{t('seconds')}</FieldLabel>
			<NumberInput value={seconds} onChange={handleSeconds} id={idleTimeLimitSec} max={59} min={0} />
		</FieldRow>
	);
};

export default IdleTimeEditor;
