import { Accordion, Field, FieldLabel, FieldRow, NumberInput, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesUserPresenceSection = () => {
	const t = useTranslation();
	const { control, setValue } = useFormContext();
	const [hours, setHours] = useState<number >(0)
	const [minutes, setMinutes] = useState<number >(5)
	const [seconds, setSeconds] = useState<number >(0)
	const [FinalSecondCount, setFinalSecondCount] = useState<number | undefined>(hours * 3600 + minutes * 60 + seconds)

	const enableAutoAwayId = useUniqueId();
	const idleTimeLimitHrs = useUniqueId();
	const idleTimeLimitMin = useUniqueId();
	const idleTimeLimitSec = useUniqueId();
	function handleHours(e:any) {
		setHours(Number(e.target.value))
	}

	function handleMinutes(e:any) {
		setMinutes(Number(e.target.value))
	}

	function handleSeconds(e:any) {
		setSeconds(Number(e.target.value))
	}

	useEffect(() => {
		handleFinalSecondCount();
	}, [hours, minutes, seconds]) 



	function handleFinalSecondCount() {
		setFinalSecondCount(hours * 3600 + minutes * 60 + seconds);
		console.log(FinalSecondCount)
		setValue('idleTimeLimit', FinalSecondCount);
	}

	return (
		<Accordion.Item title={t('User_Presence')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={enableAutoAwayId}>{t('Enable_Auto_Away')}</FieldLabel>
						<Controller
							name='enableAutoAway'
							control={control}
							render={({ field: { ref, value, onChange } }) => (
								<ToggleSwitch ref={ref} id={enableAutoAwayId} checked={value} onChange={onChange} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
						<FieldLabel htmlFor={idleTimeLimitHrs}>{t('hours')}</FieldLabel>
						<NumberInput value={hours} onChange={handleHours}/>
						<FieldLabel htmlFor={idleTimeLimitMin}>{t('minutes')}</FieldLabel>
						<NumberInput value={minutes} onChange={handleMinutes} />
						<FieldLabel htmlFor={idleTimeLimitSec}>{t('seconds')}</FieldLabel>
						<NumberInput value={seconds} onChange={handleSeconds} />
					</FieldRow>
					<FieldRow>
						<FieldLabel >{t('seconds')}</FieldLabel>
							<NumberInput value={FinalSecondCount}/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesUserPresenceSection;
