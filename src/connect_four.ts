import { number } from "prop-types";

export type Tile = 'EMPTY' | 'PLAYER_1' | 'PLAYER_2';
export type GameState = 'PLAYER_1_TURN' | 'PLAYER_2_TURN' | 'PLAYER_1_WIN' | 'PLAYER_2_WIN' | 'DRAW';

export const Constants = {
    COLUMNS: 7,
    ROWS: 6,
    ALL_COLUMNS_INDICES: [0, 1, 2, 3, 4, 5, 6],
    ALL_ROW_INDICES: [0, 1, 2, 3, 4, 5],
    TURN_TO_TILE_MAP: {
        'PLAYER_1_TURN': 'PLAYER_1',
        'PLAYER_2_TURN': 'PLAYER_2'
    }
}

export class ConnectFourGame {
    board: Tile[][];
    gameState: GameState;
    moveHistory: number[];
    gameStateHistory: GameState[];

    constructor() {
        this.board = [
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
            ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
        ];
        this.gameState = 'PLAYER_1_TURN';
        this.moveHistory = [];
        this.gameStateHistory = ['PLAYER_1_TURN'];
    }

    isOver() {
        return this.gameState != 'PLAYER_1_TURN' && this.gameState != 'PLAYER_2_TURN';
    }

    moveIsValid(column: number) {
        return this.board[Constants.ROWS - 1][column] == 'EMPTY';
    }

    validMoves() {
        return Constants.ALL_COLUMNS_INDICES.filter(column => this.moveIsValid(column));
    }

    currentPlayer(): 'PLAYER_1' | 'PLAYER_2' {
        if (this.gameStateHistory.length === 1) {
            return 'PLAYER_1';
        }
        
        const previousGameState = this.gameStateHistory[this.gameState.length - 2];
        if (previousGameState === 'PLAYER_1_TURN') {
            return 'PLAYER_2';
        } else if (previousGameState === 'PLAYER_2_TURN') {
            return 'PLAYER_1';
        }
    }

    playerHasWon(player: 'PLAYER_1' | 'PLAYER_2') {
        if (this.gameState === 'PLAYER_1_WIN' && player === 'PLAYER_1') {
            return true;
        } else if (this.gameState === 'PLAYER_2_WIN' && player === 'PLAYER_2') {
            return true;
        } else {
            return false;
        }
    }

    push(column: number) {
        if (this.isOver()) {
            throw new Error("Invalid move. Game is already over.");
        }


        if (!this.moveIsValid(column)) {
            throw new Error("Invalid move. Column is filled.");
        }

        const rowToFill = Math.min(...Constants.ALL_ROW_INDICES.filter(row => this.board[row][column] == 'EMPTY'));

        this.board[rowToFill][column] = Constants.TURN_TO_TILE_MAP[this.gameState];

        const updatedGameState = this._calculateUpdatedGameState(rowToFill, column);
        this.gameState = updatedGameState;

        this.moveHistory.push(column);
        this.gameStateHistory.push(updatedGameState);
    }

    pop() {
        if (this.moveHistory.length === 0) {
            throw new Error("Can't undo. No move to undo.");
        }

        const column = this.moveHistory.pop();
        this.gameStateHistory.pop();
        const previousGameState = this.gameStateHistory[this.gameStateHistory.length - 1];
        
        const rowToClear = Math.max(...Constants.ALL_ROW_INDICES.filter(row => this.board[row][column] != 'EMPTY'));

        this.board[rowToClear][column] = 'EMPTY';
        this.gameState = previousGameState;
    }

    _calculateUpdatedGameState(changedRow: number, changedColumn: number): GameState {
        //  Check column for victory
        const findFourInARow = (tiles: Tile[]): undefined | 'PLAYER_1_WIN' | 'PLAYER_2_WIN' => {
            var consecutiveTile: Tile = 'EMPTY';
            var consecutiveCount = 0;
            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i] === consecutiveTile) {
                    consecutiveCount += 1;
                } else {
                    consecutiveTile = tiles[i];
                    consecutiveCount = 1;
                }

                if (consecutiveCount === 4 && consecutiveTile !== 'EMPTY') {
                    if (consecutiveTile === 'PLAYER_1') {
                        return 'PLAYER_1_WIN';
                    } else {
                        return 'PLAYER_2_WIN';
                    }
                }
            }

            return undefined;
        }

        const columnTiles = Constants.ALL_ROW_INDICES.map(row => this.board[row][changedColumn]);
        const columnFourInARow = findFourInARow(columnTiles);
        if (columnFourInARow) {
            return columnFourInARow;
        }

        const rowTiles = Constants.ALL_COLUMNS_INDICES.map(column => this.board[changedRow][column]);
        const rowFourInARow = findFourInARow(rowTiles);
        if (rowFourInARow) {
            return rowFourInARow;
        }

        // Up-right diagonal
        var delta = Math.min(changedRow, changedColumn);
        var columnIndex = changedColumn - delta;
        var rowIndex = changedRow - delta;
        const upRightDiagonalTiles = [];
        while (columnIndex < Constants.COLUMNS && rowIndex < Constants.ROWS) {
            upRightDiagonalTiles.push(this.board[rowIndex][columnIndex]);
            columnIndex += 1;
            rowIndex += 1;
        }
        const upDiagonalFourInARow = findFourInARow(upRightDiagonalTiles);
        if (upDiagonalFourInARow) {
            return upDiagonalFourInARow;
        }

        // # Up-left
        delta = Math.min(Constants.COLUMNS - changedColumn, changedRow);
        columnIndex = changedColumn + delta;
        rowIndex = changedRow - delta;
        const upLeftDiagonalTiles = []
        while (columnIndex >= 0 && rowIndex < Constants.ROWS) {
            upLeftDiagonalTiles.push(this.board[rowIndex][columnIndex]);
            columnIndex -= 1;
            rowIndex += 1;
        }
        const upLeftDiagonalFourInARow = findFourInARow(upLeftDiagonalTiles);
        if (upLeftDiagonalFourInARow) {
            return upLeftDiagonalFourInARow;
        }

        if (this.validMoves().length == 0) {
            return 'DRAW';
        }

        if (this.gameState === 'PLAYER_1_TURN') {
            return 'PLAYER_2_TURN';
        } else {
            return 'PLAYER_1_TURN';
        }
    }
}