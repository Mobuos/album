import React, { useState, useEffect } from 'react'
import axios from 'axios';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  const [counter, setCounter] = useState(0);
  

  useEffect(() => {
    axios.get('/counter')
    .then(response => {
      setCounter(response.data.value);
    })
    .catch(error => {
      console.error('There was an error fetching the counter:', error);
    });
  }, []);
  
  const incrementCounter = () => {
    axios.post('/counter')
    .then(response => {
      setCounter(response.data.value);
    })
    .catch(error => {
      console.error('There was an error incrementing the counter:', error);
    });
  };
  
  return (
    <div className="App">
    <h1>Counter Value: {counter}</h1>
    <button onClick={incrementCounter}>Increment Counter</button>
    </div>
  );
  
  // return (
  //   <>
  //     <div>
  //       <a href="https://vite.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.jsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //   </>
  // )
}

export default App
