import { GameComponent } from './GameComponent';
import * as ReactDOM from 'react-dom';
import * as React from 'react';

console.log("Hello world!");

const gameNode = document.getElementById("game");
ReactDOM.render(React.createElement(GameComponent, null), gameNode);