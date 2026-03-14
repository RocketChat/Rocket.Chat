import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Upload } from '../../../../lib/chats/Upload';

type UploadProgressIndicatorProps = {
	uploads: readonly Upload[];
};

const UploadProgressIndicator = ({ uploads }: UploadProgressIndicatorProps): ReactElement | null => {
	const { t } = useTranslation();

	const { percentage, count } = useMemo(() => {
		const validUploads = uploads.filter((upload) => !upload.error);
		const activeUploads = validUploads.filter((upload) => upload.percentage < 100);

		if (activeUploads.length === 0) {
			return { percentage: 0, count: 0 };
		}

		const totalPercentage = validUploads.reduce((sum, upload) => sum + upload.percentage, 0);
		const avgPercentage = Math.round(totalPercentage / validUploads.length);

		return {
			percentage: avgPercentage,
			count: activeUploads.length,
		};
	}, [uploads]);

	const customClass = useMemo(
		() => css`
			position: relative;
			display: flex;
			justify-content: center;
			z-index: 3;

			& .rcx-bubble__item {
				position: relative;

				> span {
					z-index: 2;
				}

				&::after {
					content: '';
					position: absolute;
					left: 0;
					top: 0;
					width: ${percentage}%;
					height: 100%;
					transition: width 0.3s ease-out;
					background-color: var(--rcx-color-button-background-primary-press, #10529e);
				}
			}
		`,
		[percentage],
	);

	if (count === 0) {
		return null;
	}

	return (
		<Box className={customClass} mbs={8}>
			<Bubble role='status'>{`${percentage}% ${t('Uploading__count__file', { count })}`}</Bubble>
		</Box>
	);
};

export default UploadProgressIndicator;
