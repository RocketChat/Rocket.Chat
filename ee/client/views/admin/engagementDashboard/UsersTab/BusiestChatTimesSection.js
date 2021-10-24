import { Select } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Section } from '../Section';
import ContentForDays from './ContentForDays';
import ContentForHours from './ContentForHours';

const BusiestChatTimesSection = ({ timezone }) => {
	const t = useTranslation();

	const [timeUnit, setTimeUnit] = useState('hours');
	const timeUnitOptions = useMemo(
		() => [
			['hours', t('Hours')],
			['days', t('Days')],
		],
		[t],
	);

	const [displacement, setDisplacement] = useState(0);

	const handleTimeUnitChange = (timeUnit) => {
		setTimeUnit(timeUnit);
		setDisplacement(0);
	};

	const handlePreviousDateClick = () => setDisplacement((displacement) => displacement + 1);
	const handleNextDateClick = () => setDisplacement((displacement) => displacement - 1);

	const Content =
		(timeUnit === 'hours' && ContentForHours) || (timeUnit === 'days' && ContentForDays);

	return (
		<Section
			title={t('When_is_the_chat_busier?')}
			filter={<Select options={timeUnitOptions} value={timeUnit} onChange={handleTimeUnitChange} />}
		>
			<Content
				displacement={displacement}
				onPreviousDateClick={handlePreviousDateClick}
				onNextDateClick={handleNextDateClick}
				timezone={timezone}
			/>
		</Section>
	);
};

export default BusiestChatTimesSection;
