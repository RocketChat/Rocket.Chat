import { Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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

	return (
		<>
			{bundledIn.map(({ bundleId, bundleName }) => {
				// TODO NBJ: Remove this when enterprise is renamed to premium in the Apps data
				const handleBundleName = bundleName === 'Enterprise' ? 'Premium' : bundleName;
				return (
					<Tag
						key={bundleId}
						variant='featured'
						title={t('this_app_is_included_with_subscription', {
							bundleName: handleBundleName,
						})}
					>
						{handleBundleName}
					</Tag>
				);
			})}
		</>
	);
};

export default BundleChips;
