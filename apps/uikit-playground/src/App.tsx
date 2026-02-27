import { Box } from '@rocket.chat/fuselage';
import { useMediaQueries } from '@rocket.chat/fuselage-hooks';
import { ToastBarProvider } from '@rocket.chat/fuselage-toastbar';
import { useContext, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { HomeLayout } from './Components/Routes/HomeLayout';
import { ProjectSpecificLayout } from './Components/Routes/ProjectSpecificLayout';
import { context, isMobileAction, isTabletAction } from './Context';
import FlowDiagram from './Pages/FlowDiagram';
import Home from './Pages/Home';
import Playground from './Pages/Playground';
import Prototype from './Pages/Prototype';
import SignInToWorkspace from './Pages/SignInSignUp';
import routes from './Routes/Routes';

import './App.css';
import './_global.css';
import './cssVariables.css';

function App() {
	const { dispatch } = useContext(context);

	const [isMobile, isTablet] = useMediaQueries('(max-width: 630px)', '(max-width: 1050px)');

	useEffect(() => {
		dispatch(isMobileAction(isMobile));
	}, [isMobile, dispatch]);

	useEffect(() => {
		dispatch(isTabletAction(isTablet));
	}, [isTablet, dispatch]);
	return (
		<Box w='100vw' h='100vh' display='flex' flexDirection='column'>
			<ToastBarProvider>
				<BrowserRouter>
					<Routes>
						<Route element={<HomeLayout />}>
							<Route path={routes.login} element={<SignInToWorkspace route={routes.login} />} />
							<Route path={routes.signup} element={<SignInToWorkspace route={routes.signup} />} />
						</Route>
						{/* <Route element={<ProtectedLayout />}> */}
						<Route path={routes.home} element={<Home />} />
						<Route path={routes.projectId} element={<ProjectSpecificLayout />}>
							<Route path={routes.flow} element={<FlowDiagram />} />
							<Route path={routes.project} element={<Playground />} />
							<Route path={routes.prototype} element={<Prototype />} />
						</Route>
						<Route path='*' element={<Home />} />
						{/* </Route> */}
					</Routes>
				</BrowserRouter>
			</ToastBarProvider>
		</Box>
	);
}

export default App;
