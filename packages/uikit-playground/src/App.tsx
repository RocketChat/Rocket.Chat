import './App.css';
import './cssVariables.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Playground from './Pages/Playground';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Playground />} />
        <Route path='*' element={<Playground />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
