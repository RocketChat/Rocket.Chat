import type { MessageActionConfig } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { useCommunicationItems } from './useCommunicationItems';
import { useInteractionItems } from './useInteractionItems';
import { GenericMenuItemProps } from '/client/components/GenericMenuItem';

type MessageActionMenuSections = {
	communication: MessageActionConfig;
	interaction: MessageActionConfig;
	apps: MessageActionConfig;
	management: MessageActionConfig;
	duplication: MessageActionConfig;
};

type newType = Omit<MessageActionConfig, 'variant' | 'label' | 'order' | 'color' | 'role' | 'group' | 'context'>;

export const useMessageActionMenu = (data: MessageActionConfig[]) => {
	console.log(data);

	// const communicationItems = useCommunicationItems();
	// const interactionItems = useInteractionItems();
	// const duplicationItems = useDuplicationItems();
	// const appsItems = useAppsItems();
	// const managementItems = useManagementItems();

	// const separatedItems: MessageActionConfig = data?.reduce((acc| item) => {
	// 	if (item.type !== undefined) {
	// 		if (acc[item.type]) {
	// 			acc[item?.type].push(item);
	// 		} else {
	// 			acc[item?.type] = [item];
	// 		}
	// 	}
	// 	return acc;
	// }, {} as { [key: string]: MessageActionConfig[] }) as {
	// 	[key: string]: MessageActionConfig[];
	// };

	// const communication: GenericMenuItemProps = [];

	// const separatedItems: MessageActionConfig[] = data?.reduce((result, obj) => {
	// 	const { type } = obj;
	// 	result[type].push(obj);
	// 	return result;
	// });

	// console.log(separatedItems?.communication);

	const sections = [
		// { title: '', items: communication },
		// { title: '', items: interactionItems },
		// {title:'', items: duplicationItems, permission: },
		// {title:'Apps', items: appsItems, permission: },
		// {title:'', items: managementItems, permission: },
	];

	return sections;
};
