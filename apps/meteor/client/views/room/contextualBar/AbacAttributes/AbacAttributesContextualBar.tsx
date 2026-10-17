import { ContextualbarDialog, ContextualbarSkeleton } from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import AbacAttributesInfo from './AbacAttributesInfo';
import AbacAttributesManage from './AbacAttributesManage';
import { useAssignableAttributes } from '../../../../components/ABAC/AbacRoomCreation';
import { ABAC_ATTRIBUTES_MANAGE_CONTEXT, ABAC_ATTRIBUTES_TAB } from '../../../../lib/constants';
import { useRoom } from '../../contexts/RoomContext';

const AbacAttributesContextualBar = () => {
	const room = useRoom();
	const { context, openTab, closeTab } = useRoomToolbox();
	const { data: requiredAttributeKeys, isPending } = useAssignableAttributes(true, (data) => data.requiredKeys, room._id);

	const requiredKeys = useMemo(
		() => (requiredAttributeKeys ?? []).map((key) => key.trim()).filter((key) => key.length > 0),
		[requiredAttributeKeys],
	);

	if (isPending) {
		return <ContextualbarSkeleton onClose={closeTab} />;
	}

	const showInfo = () => openTab(ABAC_ATTRIBUTES_TAB, '');

	return (
		<ContextualbarDialog onClose={closeTab}>
			{context === ABAC_ATTRIBUTES_MANAGE_CONTEXT ? (
				<AbacAttributesManage
					key={room._id}
					room={room}
					requiredKeys={requiredKeys}
					onBack={showInfo}
					onClose={closeTab}
					onSaved={showInfo}
				/>
			) : (
				<AbacAttributesInfo
					attributes={room.abacAttributes ?? []}
					requiredKeys={requiredKeys}
					isTeam={!!room.teamMain}
					onManage={() => openTab(ABAC_ATTRIBUTES_TAB, ABAC_ATTRIBUTES_MANAGE_CONTEXT)}
					onClose={closeTab}
				/>
			)}
		</ContextualbarDialog>
	);
};

export default AbacAttributesContextualBar;
