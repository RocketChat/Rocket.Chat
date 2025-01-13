import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import '@rocket.chat/icons/dist/rocketchat.css';
import '@rocket.chat/fuselage/dist/fuselage.css';

import App from './App';
import { Provider } from './Context';
import PersistStore from './Components/PersistStore/PersistStore';
import './index.css';

ReactDOM.render(
  <StrictMode>
    <Provider>
      <PersistStore>
        <App />
      </PersistStore>
    </Provider>
  </StrictMode>,
  document.getElementById('root')
);
