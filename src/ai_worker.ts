import { ConnectFourGame, Constants } from "./connect_four";

class MCTS {
    game: ConnectFourGame
    root: MCTSNode

    constructor(game: ConnectFourGame) {
        this.game = game;
        this.root = new MCTSNode(game.validMoves(), undefined);
    }

    search(): number | undefined {
        if (this.game.isOver()) {
            return undefined;
        }

        var totalIterations = 0;
        const start = performance.now();
        const computationTime = 1 * 1000; // 1 second
        while (performance.now() - start < computationTime) {
            for (var i = 0; i < 2000; i++) {
                this.root._search(this.game, findCurrentTargetState(this.game));
            }
            totalIterations += 2000;
        }

        console.log(totalIterations)
        return this.root.expSelectMove();
    }
}

function findCurrentTargetState(game: ConnectFourGame): 'PLAYER_1_WIN' | 'PLAYER_2_WIN' {
    if (game.gameState === 'PLAYER_1_TURN') {
        return 'PLAYER_1_WIN';
    } else if (game.gameState === 'PLAYER_2_TURN') {
        return 'PLAYER_2_WIN';
    } else {
        throw new Error('Unexpected conditions');
    }
}

function randomPlaythrough(game: ConnectFourGame): 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW' {
    var moveCount = 0;
    while (!game.isOver()) {
        const validMoves = game.validMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.push(randomMove);
        moveCount += 1;
    }

    const result = game.gameState as 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW';
    for (var i = 0; i < moveCount; i++) {
        game.pop();
    }
    return result;
}

class MCTSNode {
    move: number
    wins: number
    n: number
    validMoves: number[]
    moveToChildMap: MCTSNode[]

    constructor(validMoves: number[], move: number) {
        this.move = move;
        this.wins = 0;
        this.n = 0;
        this.validMoves = validMoves;
        this.moveToChildMap = [];
    }

    search(game: ConnectFourGame): 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW' {
        const targetState = findCurrentTargetState(game);

        game.push(this.move);
        const searchResult = this._search(game, targetState);
        game.pop();

        return searchResult;
    }

    getMoveChildPairs(): [number, MCTSNode | undefined][] {
        return this.validMoves.map(move => [move, this.moveToChildMap[move]]);
    }

    ucbSelectMove(): number {
        const c = Math.sqrt(2);
        var bestMove: number = undefined;
        var bestMoveScore: number = -Infinity;
        for (const [move, child] of this.getMoveChildPairs()) {
            if (!child) {
                return move;
            }
            const score = (child.wins / child.n) + c * Math.sqrt(Math.log(this.n) / child.n);
            if (score > bestMoveScore) {
                bestMove = move;
                bestMoveScore = score;
            }
        }

        return bestMove;
    }

    expSelectMove(): number {
        var bestMove: number = undefined;
        var bestMoveScore: number = -Infinity;
        for (const [move, child] of this.getMoveChildPairs()) {
            if (!child) {
                continue;
            }

            const score = (child.wins / child.n);
            if (score > bestMoveScore) {
                bestMove = move;
                bestMoveScore = score;
            }
        }

        return bestMove;
    }

    _search(game: ConnectFourGame, targetState: 'PLAYER_1_WIN' | 'PLAYER_2_WIN'): 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW' {
        this.n += 1
        if (game.isOver()) {
            if (game.gameState === targetState) {
                this.wins += 1;
            }
            return game.gameState as 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW';
        }

        const selectedMove = this.ucbSelectMove();
        var child = this.moveToChildMap[selectedMove];
        // If child is undefeined
        if (!child) {
            // Compute required info
            const childTargetState = findCurrentTargetState(game);
            game.push(selectedMove);
            const childValidMoves = game.validMoves();
            game.pop();

            // Create child
            child = new MCTSNode(childValidMoves, selectedMove);
            this.moveToChildMap[selectedMove] = child;

            // Do random playthrough
            game.push(selectedMove);
            const randomPlaythroughResult = randomPlaythrough(game);
            game.pop();

            // Update model
            child.n += 1;
            if (randomPlaythroughResult === childTargetState) {
                child.wins += 1;
            }

            if (randomPlaythroughResult === targetState) {
                this.wins += 1;
            }

            return randomPlaythroughResult;

        } else {
            const result = child.search(game);
            if (result === targetState) {
                this.wins += 1;
            }

            return result;
        }
    }
}

onmessage = function (msg: MessageEvent) {
    const game = new ConnectFourGame();
    game.board = msg.data.board;
    game.gameState = msg.data.gameState;
    game.moveHistory = msg.data.moveHistory;
    game.gameStateHistory = msg.data.gameStateHistory;

    const mcts = new MCTS(game);
    const bestMove = mcts.search();

    postMessage(bestMove);
}


