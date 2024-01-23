import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.tsx';
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
// import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

ReactDOM.render(
	<React.StrictMode>
		<QueryClientProvider client={new QueryClient()}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
	document.getElementById('root')!,
);
