import { Box, Icon, PositionAnimated, AnimatedVisibility, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { RefObject, useRef, useState, ReactElement, Fragment } from 'react';

import { App } from './types';

type BundleChipsProps = {
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
	}[];
	isIconOnly?: boolean;
};

const BundleChips = ({ bundledIn, isIconOnly }: BundleChipsProps): ReactElement => {
	const t = useTranslation();

	const bundleRef = useRef<Element>();
	const [isHovered, setIsHovered] = useState(false);

	return (
		<>
			{bundledIn.map((bundle) => (
				<Fragment key={bundle.bundleId}>
					<Box
						display='flex'
						flexDirection='row'
						alignItems='center'
						justifyContent='center'
						backgroundColor='disabled'
						pi='x4'
						height='x20'
						borderRadius='x2'
						ref={bundleRef}
						onMouseEnter={(): void => setIsHovered(true)}
						onMouseLeave={(): void => setIsHovered(false)}
					>
						<Icon name='bag' size='x20' />
						{!isIconOnly && (
							<Box fontScale='c2' color='info' style={{ whiteSpace: 'nowrap' }}>
								{t('bundle_chip_title', {
									bundleName: bundle.bundleName,
								})}
							</Box>
						)}
					</Box>
					<PositionAnimated
						anchor={bundleRef as RefObject<Element>}
						placement='top-middle'
						margin={8}
						visible={isHovered ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}
					>
						<Tooltip>
							{t('this_app_is_included_with_subscription', {
								bundleName: bundle.bundleName,
							})}
						</Tooltip>
					</PositionAnimated>
				</Fragment>
			))}
		</>
	);
};

export default BundleChips;
