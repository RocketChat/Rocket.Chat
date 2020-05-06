export default function useExampleData({ emoji, alias, avatar, url }) {
	const exampleData = {
		...alias && { username: alias },
		...emoji && { icon_emoji: emoji },
		...avatar && { icon_url: avatar },
		text: 'Example message',
		attachments: [{
			title: 'Rocket.Chat',
			title_link: 'https://rocket.chat',
			text: 'Rocket.Chat, the best open source chat',
			image_url: '/images/integration-attachment-example.png',
			color: '#764FA5',
		}],
	};

	return [
		JSON.stringify(exampleData),
		`curl -X POST -H 'Content-Type: application/json' --data '${ JSON.stringify(exampleData) }' ${ url }`,
	];
}
