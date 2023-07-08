import React from 'react';
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

function App() {
  return (
    <ToastBarProvider>
      <BrowserRouter>
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
  );
}

export default App;
