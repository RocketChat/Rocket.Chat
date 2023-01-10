import { Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { Fragment, useRef } from 'react';

import type { App } from './types';

type BundleChipsProps = {
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
	}[];
};

const BundleChips = ({ bundledIn }: BundleChipsProps): ReactElement => {
	const t = useTranslation();
	const bundleRef = useRef<Element>();
	return (
		<>
			{bundledIn.map((bundle) => (
				<Fragment key={bundle.bundleId}>
					<Box ref={bundleRef}>
						<Tag
							variant='featured'
							title={t('this_app_is_included_with_subscription', {
								bundleName: bundle.bundleName,
							})}
						>
							{bundle.bundleName}
						</Tag>
					</Box>
				</Fragment>
			))}
		</>
	);
};

export default BundleChips;
