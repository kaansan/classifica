import { hot } from 'react-hot-loader/root';
import React, { useState } from 'react';


function App(props) {
    const [counter, setCounter] = useState(0)

    return (
        <>
            <div>
                {counter}
            </div>
            <button onClick={() => setCounter(counter + 1)}>Testing</button>
        </>
    );
}

export default hot(App);