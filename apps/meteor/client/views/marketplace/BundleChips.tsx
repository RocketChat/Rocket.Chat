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

	const handleLabel = (label: string): string => {
		if (label === 'Enterprise') {
			return 'Premium';
		}
		return label;
	};

	return (
		<>
			{bundledIn.map(({ bundleId, bundleName }) => {
				// this is a workaround to not change plan name for versions lower than 6.5.0
				const handledBundledName = handleLabel(bundleName);

				return (
					<Tag
						key={bundleId}
						variant='featured'
						title={t('this_app_is_included_with_subscription', {
							bundleName: handledBundledName,
						})}
					>
						{handledBundledName}
					</Tag>
				);
			})}
		</>
	);
};

export default BundleChips;
