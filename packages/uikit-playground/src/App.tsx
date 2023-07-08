import { useContext, useEffect } from 'react';
import './App.css';
import './_global.css';
import './cssVariables.css';
import { ToastBarProvider } from '@rocket.chat/fuselage-toastbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { HomeLayout } from './Components/Routes/HomeLayout';
import Playground from './Pages/Playground';
import SignInToWorkspace from './Pages/SignInSignUp';
import routes from './Routes/Routes';
import Home from './Pages/Home';
import { context, isMobileAction, isTabletAction } from './Context';
import { useMediaQueries } from '@rocket.chat/fuselage-hooks';
import NavMenu from './Components/navMenu/NavMenu';
import NavBar from './Components/NavBar';
import { Box } from '@rocket.chat/fuselage';

function App() {
  const {
    state: { navMenuToggle },
    dispatch,
  } = useContext(context);

  const [isMobile, isTablet] = useMediaQueries(
    '(max-width: 630px)',
    '(max-width: 1050px)'
  );

  useEffect(() => {
    dispatch(isMobileAction(isMobile));
  }, [isMobile, dispatch]);

  useEffect(() => {
    dispatch(isTabletAction(isTablet));
  }, [isTablet, dispatch]);
  return (
    <Box w="100vw" h="100vh" display="flex" flexDirection="column">
      <ToastBarProvider>
        <BrowserRouter>
          <NavBar />
          {navMenuToggle && <NavMenu />}
          <Routes>
            <Route element={<HomeLayout />}>
              <Route
                path={routes.login}
                element={<SignInToWorkspace route={routes.login} />}
              />
              <Route
                path={routes.signup}
                element={<SignInToWorkspace route={routes.signup} />}
              />
            </Route>
            {/* <Route element={<ProtectedLayout />}> */}
            <Route path={routes.home} element={<Home />} />
            <Route path={routes.project} element={<Playground />} />
            <Route path={`*`} element={<Playground />} />
            {/* </Route> */}
          </Routes>
        </BrowserRouter>
      </ToastBarProvider>
    </Box>
  );
}

export default App;
