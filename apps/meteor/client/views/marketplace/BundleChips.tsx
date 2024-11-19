import type { App } from '@rocket.chat/core-typings';
import { Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type BundleChipsProps = {
	bundledIn: {
		bundleId: string;
		bundleName: string;
		apps: App[];
	}[];
};

const BundleChips = ({ bundledIn }: BundleChipsProps): ReactElement => {
	const { t } = useTranslation();

	const handlePlanName = (label: string): string => {
		if (label === 'Enterprise') {
			return 'Premium';
		}
		return label;
	};

	return (
		<>
			{bundledIn.map(({ bundleId, bundleName }) => {
				// this is a workaround to not change plan name for versions lower than 6.5.0
				const handledName = handlePlanName(bundleName);

				return (
					<Tag
						key={bundleId}
						variant='featured'
						title={t('this_app_is_included_with_subscription', {
							bundleName: handledName,
						})}
					>
						{handledName}
					</Tag>
				);
			})}
		</>
	);
};

export default BundleChips;
