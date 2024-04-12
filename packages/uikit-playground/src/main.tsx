import React from 'react';
import ReactDOM from 'react-dom';
import '@rocket.chat/icons/dist/rocketchat.css';
import '@rocket.chat/fuselage/dist/fuselage.css';

import './index.css';
import App from './App';
import { Provider } from './Context';
import PersistStore from './Components/PersistStore/PersistStore';

ReactDOM.render(
  <React.StrictMode>
    <Provider>
      <PersistStore>
        <App />
      </PersistStore>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
