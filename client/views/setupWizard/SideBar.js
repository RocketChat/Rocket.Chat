import { Box, Margins, Scrollable } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import Logo from '../../components/basic/Logo';
import './SideBar.css';

function SideBar({
	logoSrc = 'images/logo/logo.svg',
	currentStep = 1,
	steps = [],
}) {
	const t = useTranslation();
	const small = useMediaQuery('(max-width: 760px)');

	return <Box
		is='aside'
		className='SetupWizard__SideBar'
		flexGrow={0}
		flexShrink={1}
		flexBasis={small ? 'auto' : '350px'}
		maxHeight='sh'
		display='flex'
		flexDirection='column'
		flexWrap='nowrap'
		style={{ overflow: 'hidden' }}
	>
		<Box
			is='header'
			marginBlockStart={small ? 'x16' : 'x32'}
			marginBlockEnd={small ? 'none' : 'x32'}
			marginInline='x24'
			display='flex'
			flexDirection='row'
			flexWrap='wrap'
			alignItems='center'
		>
			<Logo
				src={logoSrc}
				width='auto'
				height='x24'
				margin='x4'
			/>
			<Box
				is='span'
				margin='x4'
				paddingBlock='x4'
				paddingInline='x8'
				color='alternative'
				fontScale='micro'
				style={{
					whiteSpace: 'nowrap',
					textTransform: 'uppercase',
					backgroundColor: 'var(--color-dark, #2f343d)',
					borderRadius: '9999px',
				}}
			>
				{t('Setup_Wizard')}
			</Box>
		</Box>

		{!small && <Scrollable>
			<Box
				flexGrow={1}
				marginBlockEnd='x16'
				paddingInline='x32'
			>
				<Margins blockEnd='x16'>
					<Box is='h2' fontScale='h1' color='default'>{t('Setup_Wizard')}</Box>
					<Box is='p' color='hint' fontScale='p1'>{t('Setup_Wizard_Info')}</Box>
				</Margins>

				<Box is='ol'>
					{steps.map(({ step, title }) =>
						<Box
							key={step}
							is='li'
							className={[
								'SetupWizard__SideBar-step',
								step < currentStep && 'SetupWizard__SideBar-step--past',
							].filter(Boolean).join(' ')}
							data-number={step}
							marginBlock='x32'
							marginInline='neg-x8'
							display='flex'
							alignItems='center'
							fontScale='p2'
							color={(step === currentStep && 'primary')
							|| (step < currentStep && 'default')
							|| 'disabled'}
							style={{ position: 'relative' }}
						>
							{title}
						</Box>,
					)}
				</Box>
			</Box>
		</Scrollable>}
	</Box>;
}

export default SideBar;
