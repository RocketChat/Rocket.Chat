import { Box, SidebarItem } from '@rocket.chat/fuselage';
import type colors from '@rocket.chat/fuselage-tokens/colors';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import type { UpsellModalProps } from '../UpsellModal';
import UpsellModal from '../UpsellModal';

type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	featured?: boolean;
	children: ReactNode;
	customColors?: {
		default: (typeof colors)[string];
		hover: (typeof colors)[string];
		active: (typeof colors)[string];
	};
	externalUrl?: boolean;
};

const SidebarGenericItem = ({ href, active, externalUrl, children, ...props }: SidebarGenericItemProps): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const handleModalClose = useCallback(() => setModal(null), [setModal]);

	const handleSetUpsellModal = (upsellModal?: UpsellModalProps) => {
		if (upsellModal) {
			setModal(
				<UpsellModal
					title={upsellModal.title}
					img={upsellModal.img}
					subtitle={upsellModal.subtitle}
					description={upsellModal.description}
					confirmText={upsellModal.confirmText}
					cancelText={upsellModal.cancelText}
					onConfirm={upsellModal.onConfirm}
					onCancel={upsellModal.onCancel}
					onClose={upsellModal.onClose}
				/>,
			);
		}
	};

	const isUpsell = (href?: string) => {
		const upsellModals: { [key: string]: UpsellModalProps } = {
			'/admin/engagement-dashboard': {
				title: t('Enable_unlimited_apps'),
				img: 'images/unlimited-apps-modal.svg',
				subtitle: t('Get_all_apps'),
				description: 'test',
				confirmText: 'test',
				cancelText: t('Talk_to_sales'),
				onConfirm: () => console.log('test'),
				onCancel: () => console.log('test'),
				onClose: handleModalClose,
			},
		};

		return href ? upsellModals[href] : undefined;
	};

	return (
		<SidebarItem
			selected={active}
			clickable
			is='a'
			href={isUpsell(href) ? undefined : href}
			onClick={
				isUpsell(href)
					? () => handleSetUpsellModal(isUpsell(href))
					: () => {
							return null;
					  }
			}
			{...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })}
			{...props}
		>
			<Box display='flex' flexDirection='row' alignItems='center' pb='x8' width='100%'>
				{children}
			</Box>
		</SidebarItem>
	);
};

export default memo(SidebarGenericItem);
