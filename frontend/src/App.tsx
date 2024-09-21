import React from 'react';
import HeaderList from './components/HeaderList';
import './App.css';

const App: React.FC = () => {
    return (
        <div className="App">
            <h1>Polkadot Block Headers</h1>
            <HeaderList/>
        </div>
    );
};

export default App;
