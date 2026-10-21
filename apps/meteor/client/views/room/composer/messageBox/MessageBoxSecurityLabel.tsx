import { Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import SecurityMarkingTag from '../../../../components/message/SecurityMarkingTag';
import { roomsQueryKeys } from '../../../../lib/queryKeys';
import { selectedSecurityLabels } from '../../../../lib/securityLabels/selectedSecurityLabels';
import { useRoom } from '../../contexts/RoomContext';

type MessageBoxSecurityLabelProps = {
	disabled: boolean;
};

const sameLabel = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const MessageBoxSecurityLabel = ({ disabled }: MessageBoxSecurityLabelProps) => {
	const { t } = useTranslation();
	const room = useRoom();
	const enabled = useSetting('DCS_Enabled', false) && !!room.securityClearance;
	const getCatalog = useEndpoint('GET', '/v1/dcs/rooms/:rid/catalog', { rid: room._id });

	const { data: items = [] } = useQuery({
		queryKey: [...roomsQueryKeys.room(room._id), 'securityLabelCatalog', room.securityClearance, room.defaultSecurityLabel],
		queryFn: async () =>
			(await getCatalog({})).items.map((item) => ({
				...item,
				label: { policyId: item.label.policyId, classification: item.label.classification, categories: item.label.categories },
			})),
		enabled,
	});

	const selected = useSyncExternalStore(selectedSecurityLabels.subscribe, () => selectedSecurityLabels.get(room._id));
	const current = items.find(({ label }) => sameLabel(label, selected)) ?? items.find((item) => item.default) ?? items[0];

	useEffect(() => {
		if (current && !sameLabel(current.label, selected)) {
			selectedSecurityLabels.set(room._id, current.label);
		}
	}, [current, selected, room._id]);

	if (!enabled || !current) {
		return null;
	}

	const sections = [
		{
			title: t('Security_label'),
			items: items.map((item) => ({
				id: item.selector,
				content: item.marking.text,
				icon: item === current ? ('check' as const) : undefined,
				onClick: () => selectedSecurityLabels.set(room._id, item.label),
			})),
		},
	];

	return (
		<Box display='flex' alignItems='center'>
			<GenericMenu title={t('Security_label')} icon='shield' detached disabled={disabled} sections={sections} />
			<SecurityMarkingTag marking={current.marking} />
		</Box>
	);
};

export default MessageBoxSecurityLabel;
