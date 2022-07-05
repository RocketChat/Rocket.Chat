import { useMemo } from 'react';

export function useExampleData({ additionalFields, url }) {
	return useMemo(() => {
		const exampleData = {
			...additionalFields,
			text: 'Example message',
			attachments: [
				{
					title: 'Rocket.Chat',
					title_link: 'https://rocket.chat',
					text: 'Rocket.Chat, the best open source chat',
					image_url: '/images/integration-attachment-example.png',
					color: '#764FA5',
				},
			],
		};

		return [exampleData, `curl -X POST -H 'Content-Type: application/json' --data '${JSON.stringify(exampleData)}' ${url}`];
	}, [additionalFields, url]);
}
