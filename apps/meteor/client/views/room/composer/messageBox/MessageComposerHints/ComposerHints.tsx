import type { IconProps } from '@rocket.chat/fuselage';
import { Box, Icon, Tooltip } from '@rocket.chat/fuselage';
import { useMediaQueries } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans } from 'react-i18next';

type ComposerHintProps = {
	leftTranslationText: string;
	leftIcon?: IconProps['name'];
	rightTranslationText?: string;
};

const ComposerHints = ({ leftTranslationText, leftIcon, rightTranslationText }: ComposerHintProps): ReactElement => {
	const t = useTranslation();
	const [isMobile] = useMediaQueries('(max-width: 600px)');

	return (
		<>
			<Box h='x24' pbs={0} pbe={4} display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' fontScale='c1'>
				<Tooltip variation='light' fontScale='c1' fontWeight='c2' h='x20' pi={4} pb={2}>
					{leftIcon && <Icon name={leftIcon} size='x16' />}
					{t(leftTranslationText)}
				</Tooltip>
				{rightTranslationText && !isMobile && (
					<Box color='font-hint'>
						<Trans i18nKey={rightTranslationText} />
					</Box>
				)}
			</Box>
		</>
	);
};

export default ComposerHints;
