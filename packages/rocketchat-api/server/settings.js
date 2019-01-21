import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.settings.addGroup('General', function() {
	this.section('REST API', function() {
		this.add('API_Upper_Count_Limit', 100, { type: 'int', public: false });
		this.add('API_Default_Count', 50, { type: 'int', public: false });
		this.add('API_Enable_Rate_Limiter_Dev', true, { type: 'boolean', public: false });
		this.add('API_Enable_Rate_Limiter_Limit_Calls_Default', 10, { type: 'int', public: false });
		this.add('API_Enable_Rate_Limiter_Limit_Time_Default', 60000, { type: 'int', public: false });
		this.add('API_Allow_Infinite_Count', true, { type: 'boolean', public: false });
		this.add('API_Enable_Direct_Message_History_EndPoint', false, { type: 'boolean', public: false });
		this.add('API_Enable_Shields', true, { type: 'boolean', public: false });
		this.add('API_Shield_Types', '*', { type: 'string', public: false, enableQuery: { _id: 'API_Enable_Shields', value: true } });
		this.add('API_Enable_CORS', false, { type: 'boolean', public: false });
		this.add('API_CORS_Origin', '*', { type: 'string', public: false, enableQuery: { _id: 'API_Enable_CORS', value: true } });
	});
});
