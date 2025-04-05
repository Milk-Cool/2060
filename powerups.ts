/*
name: Powerup display name
minLevel: Unlock level
type: Powerup type,
    where "tile" is for when you have to select a tile
    and "simple" is for when you only have to click the powerup name
callback: Powerup callback, that takes and returns a GameState
*/

import { GameState, Tile } from "2048-engine";
import Writeable from "./writeable";

export type PowerupTypeSimple = "simple";
export type PowerupTypeTile = "tile";
export type PowerupType = PowerupTypeSimple | PowerupTypeTile;
export type PowerupCallbackSimple = (state: GameState) => GameState;
export type PowerupCallbackTile = (state: GameState, x: number, y: number) => GameState;
export type PowerupCallback = PowerupCallbackSimple | PowerupCallbackTile;
export type Powerup = {
    name: string,
    minLevel: number,
    type: PowerupTypeSimple,
    callback: PowerupCallbackSimple
} | {
    name: string,
    minLevel: number,
    type: PowerupTypeTile,
    callback: PowerupCallbackTile
};

// Yes, I force the state to be writeable here. I know it's not the best way to do this.

export const powerups: Powerup[] = [
    {
        name: "Remove tile",
        minLevel: 2,
        type: "tile",
        callback(state, x, y) {
            (state.board[y][x] as Writeable<null>) = null;
            return state;
        }
    },
    {
        name: "Double tile",
        minLevel: 4,
        type: "tile",
        callback(state, x, y) {
            (state.board[y][x] as Writeable<Tile>).value *= 2;
            return state;
        }
    },
    {
        name: "Double all tiles",
        minLevel: 6,
        type: "simple",
        callback(state) {
            for(let y = 0; y < state.board.length; y++)
                for(let x = 0; x < state.board[y].length; x++)
                    if(state.board[y][x] !== null)
                        (state.board[y][x] as Writeable<Tile>).value *= 2;
            return state;
        }
    }
];