import * as React from 'react';
import { ConnectFourGame, Constants } from './connect_four';
import { useState } from 'react';

interface Props {

}

const fillColourMap = {
    'EMPTY': 'ffffff',
    'PLAYER_1': 'ff8777',
    'PLAYER_2': '77a0ff'
}

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => ++value); // update the state to force render
}

const worker = new Worker('ai_worker.ts');

export function GameComponent(props: Props) {
    const render = useForceUpdate();
    const [game, setGame] = useState<ConnectFourGame>(new ConnectFourGame());

    const playersTurn = game.gameState === 'PLAYER_1_TURN';

    const delta = 100;
    const radius = 45;
    const padding = (100 - 45) / 2;
    const tiles = Constants.ALL_ROW_INDICES
        .flatMap(row => Constants.ALL_COLUMNS_INDICES.map(column => [row, column]))
        .map(([row, column]) => {
            const fillColour = fillColourMap[game.board[row][column]];
            return <circle
                key={column * Constants.COLUMNS + row}
                cx={column * delta + padding + radius}
                cy={(Constants.ROWS - row) * delta - padding}
                r={radius}
                onClick={() => {
                    if (!playersTurn) {
                        console.log("Hol up");
                        return;
                    }
                    console.log(game);
                    game.push(column);
                    setGame(game);
                    worker.postMessage(game);
                    console.log(game);
                    render();
                }}
                style={{
                    fill: fillColour,
                    stroke: '000000',
                    strokeWidth: '2'
                }}
            />
        });

    worker.onmessage = (msg: MessageEvent) => {
        console.log(msg.data);
        game.push(msg.data);
        render();
    };

    const board = <svg viewBox='0 0 750 640' preserveAspectRatio='xMaxYMid'>
        {/* "fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" */}
        <rect width='750' height='640'
            style={{
                fill: 'none',
                stroke: '000000',
                strokeWidth: '3'
            }}
        />
        {tiles}
    </svg>

    return (
        <div>
            {board}
            {/* <button
                disabled={!playersTurn}
                onClick={() => {
                    console.log(game);
                    game.pop();
                    game.pop();
                    render();
                    console.log(game);
                }}>
                Undo
            </button>
            {game.gameState} */}
        </div>
    )
}