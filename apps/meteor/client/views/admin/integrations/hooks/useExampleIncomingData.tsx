import type { INewIncomingIntegration } from '@rocket.chat/core-typings';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type UseExampleDataParams = {
	additionalFields: Partial<INewIncomingIntegration>;
	url: string;
};

export function useExampleData({
	additionalFields,
	url,
}: UseExampleDataParams): [integrationObj: Partial<INewIncomingIntegration>, curl: string] {
	const imageUrl = useAbsoluteUrl()('/images/integration-attachment-example.png');
	return useMemo(() => {
		const exampleData = {
			...additionalFields,
			text: 'Example message',
			attachments: [
				{
					title: 'Rocket.Chat',
					title_link: 'https://rocket.chat',
					text: 'Rocket.Chat, the best open source chat',
					image_url: imageUrl,
					color: '#764FA5',
				},
			],
		};

		return [exampleData, `curl -X POST -H 'Content-Type: application/json' --data '${JSON.stringify(exampleData)}' ${url}`];
	}, [additionalFields, url, imageUrl]);
}
