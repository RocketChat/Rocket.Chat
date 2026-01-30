import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@rocket.chat/icons/dist/rocketchat.css';
import '@rocket.chat/fuselage/dist/fuselage.css';

import App from './App';
import { Provider } from './Context';
import PersistStore from './Components/PersistStore/PersistStore';
import './index.css';

const rootDiv = document.getElementById('root');

if (!rootDiv) {
  throw new Error('Root div not found');
}

const root = createRoot(rootDiv);

root.render(
  <StrictMode>
    <Provider>
      <PersistStore>
        <App />
      </PersistStore>
    </Provider>
  </StrictMode>,
);
