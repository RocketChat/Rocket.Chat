RocketChat.settings.add('Message_Read_Receipt_Enabled', false, {
	group: 'Message',
	type: 'boolean',
	public: true
});

RocketChat.settings.add('Message_Read_Receipt_Store_Users', false, {
	group: 'Message',
	type: 'boolean',
	public: false,
	enableQuery: { _id: 'Message_Read_Receipt_Enabled', value: true }
});
