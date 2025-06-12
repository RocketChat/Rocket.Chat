import 'reflect-metadata';
import { RocketChatAdapter } from './src/adapters/rocket-chat-adapter';

async function testIntegration() {
	console.log('Testing homeserver integration...');
	
	const config = {
		url: 'http://localhost:8080',
		domain: 'test.local',
		appServiceToken: 'test-token',
		homeserverToken: 'test-token',
	};
	
	try {
		const adapter = new RocketChatAdapter(config);
		await adapter.initialize();
		
		console.log('✅ Adapter initialized successfully');
		
		const routes = adapter.getRoutes();
		console.log(`✅ Found ${routes.length} routes`);
		
		// List first few routes
		routes.slice(0, 5).forEach(route => {
			console.log(`  - ${route.method} ${route.path}`);
		});
		
		// Test service access
		const services = adapter.getServices();
		console.log('✅ Services accessible');
		
		await adapter.shutdown();
		console.log('✅ Adapter shutdown successfully');
		
	} catch (error) {
		console.error('❌ Integration test failed:', error);
		process.exit(1);
	}
}

testIntegration().then(() => {
	console.log('✅ All tests passed');
	process.exit(0);
}).catch(error => {
	console.error('❌ Test failed:', error);
	process.exit(1);
});