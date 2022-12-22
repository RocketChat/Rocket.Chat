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
			{bundledIn.map((bundle, index) => (
				<Tag
					key={index}
					title={t('this_app_is_included_with_subscription', {
						bundleName: bundle.bundleName,
					})}
					variant='primary'
				>
					{bundle.bundleName}
				</Tag>
			))}
		</>
	);
};

export default BundleChips;
