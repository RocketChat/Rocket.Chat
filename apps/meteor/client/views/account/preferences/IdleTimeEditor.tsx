import { NumberInput, FieldRow, FieldLabel } from '@rocket.chat/fuselage';
import { useState, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

type IdleTimeEditorProps = {
	onChangeTime: (time: number | undefined) => void;
};

const IdleTimeEditor = ({ onChangeTime }: IdleTimeEditorProps) => {
	const { t } = useTranslation();
	const [hours, setHours] = useState<number>(() => Number(localStorage.getItem('idleHours')) || 0);
	const [minutes, setMinutes] = useState<number>(() => Number(localStorage.getItem('idleMinutes')) || 5);
	const [seconds, setSeconds] = useState<number>(() => Number(localStorage.getItem('idleSeconds')) || 0);

	useEffect(() => {
		localStorage.setItem('idleHours', String(hours));
		localStorage.setItem('idleMinutes', String(minutes));
		localStorage.setItem('idleSeconds', String(seconds));
	}, [hours, minutes, seconds]);
	const [finalSecondCount, setFinalSecondCount] = useState<number | undefined>(hours * 3600 + minutes * 60 + seconds);

	const idleTimeLimitHrs = useId();
	const idleTimeLimitMin = useId();
	const idleTimeLimitSec = useId();

	function handleHours(e: any) {
		const { value } = e.target;
		setHours(value === '' ? 0 : Number(value));
	}

	function handleMinutes(e: any) {
		const { value } = e.target;
		setMinutes(value === '' ? 0 : Number(value));
	}

	function handleSeconds(e: any) {
		const { value } = e.target;
		setSeconds(value === '' ? 0 : Number(value));
	}

	useEffect(() => {
		handleFinalSecondCount();
	}, [hours, minutes, seconds]);

	function handleFinalSecondCount() {
		setFinalSecondCount(hours * 3600 + minutes * 60 + seconds);
		onChangeTime(finalSecondCount);
	}

	return (
		<FieldRow style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<FieldLabel htmlFor={idleTimeLimitHrs}>{t('Hours')}</FieldLabel>
				<NumberInput value={hours} onChange={handleHours} id={idleTimeLimitHrs} min={0} />
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<FieldLabel htmlFor={idleTimeLimitMin}>{t('Minutes')}</FieldLabel>
				<NumberInput value={minutes} onChange={handleMinutes} id={idleTimeLimitMin} max={59} min={0} />
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<FieldLabel htmlFor={idleTimeLimitSec}>{t('Seconds')}</FieldLabel>
				<NumberInput value={seconds} onChange={handleSeconds} id={idleTimeLimitSec} max={59} min={0} />
			</div>
		</FieldRow>
	);
};

export default IdleTimeEditor;
