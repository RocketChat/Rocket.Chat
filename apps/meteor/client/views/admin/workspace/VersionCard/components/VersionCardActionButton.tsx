import { Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

type VersionCardActionButtonProps =
	| {
			path: LocationPathname;
			label: ReactNode;
	  }
	| {
			action: () => void;
			label: ReactNode;
	  };

const VersionCardActionButton = (item: VersionCardActionButtonProps): ReactElement => {
	const router = useRouter();

	const handleActionButton = useEffectEvent(() => {
		if ('action' in item) {
			return item.action();
		}

		router.navigate(item.path);
	});

	return (
		<Button primary onClick={() => handleActionButton()}>
			{item.label}
		</Button>
	);
};

export default memo(VersionCardActionButton);
