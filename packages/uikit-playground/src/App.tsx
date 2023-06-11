import React from 'react';
import './App.css';
import './_global.css';
import './cssVariables.css';
import { ToastBarProvider } from '@rocket.chat/fuselage-toastbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { HomeLayout } from './Components/Routes/HomeLayout';
import { ProtectedLayout } from './Components/Routes/ProtectedLayout';
import FlowDiagram from './Pages/FlowDiagram';
import Playground from './Pages/Playground';
import SignInToWorkspace from './Pages/SignInSignUp';
import routes from './Routes/Routes';


function App() {
  return (
    <ToastBarProvider>
      <BrowserRouter>
        <Routes>
        <Route path={`/`} element={<Playground />} />
          <Route element={<HomeLayout />}>
            <Route
              path={`/${routes.login}`}
              element={<SignInToWorkspace route={routes.login} />}
            />
            <Route
              path={`/${routes.signup}`}
              element={<SignInToWorkspace route={routes.signup} />}
            />
            <Route path={`/${routes.flow}`} element={<FlowDiagram />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path={`/${routes.home}`} element={<Playground />} />
            <Route path={`*`} element={<Playground />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastBarProvider>
  );
}

export default App;
