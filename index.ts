import { createGame, Direction, Game } from "2048-engine";

import levels from "./levels";
import strings from "./strings";
import { PowerupCallback, PowerupCallbackTile, powerups } from "./powerups";

const board = document.querySelector("#board");

const TIME = 60;

let xp = 0;
let level = 0;
let seconds = TIME;

let countInterval: number;
let renderTimeout: number | null = null;

let lastCallback: PowerupCallbackTile | null = null;
let disabledPowerups: number[] = [];

for(let _ = 0; _ < 16; _++) {
    const div = document.createElement("div");
    div.classList.add("block");
    board?.appendChild(div);
}
const blocks = document.querySelectorAll("#board > .block");

let game: Game = createGame();

const render = () => {
    for(const block of blocks)
        for(const tile of block.children)
            tile.remove();

    for(let x = 0; x < 4; x++)
        for(let y = 0; y < 4; y++) {
            const n = x + y * 4;
            const tile = game.currentState.board[y][x];
            if(tile === null) continue;
            const { value } = tile;

            const div = document.createElement("div");
            div.classList.add("tile");
            div.style.background = `hsl(98, 83%, ${20 + Math.min(20, 2 * Math.log2(value))}%)`;
            div.innerText = value.toString();

            div.addEventListener("click", () => {
                if(lastCallback === null) return;
                game.currentState = lastCallback(game.currentState, x, y);
                lastCallback = null;
                render();
            });

            blocks[n].appendChild(div);
        }
    
    (document.querySelector("#lvl") as HTMLHeadingElement).innerText = `lvl ${level}`;
    (document.querySelector("#xp") as HTMLHeadingElement).innerText = `${xp}/${levels[level] ?? "∞"} xp`;
    (document.querySelector("#progress > div") as HTMLDivElement).style.width = `${xp / (levels[level] ?? Infinity) * 100}%`;
}

const reset = () => {
    game = createGame();

    seconds = TIME;
    clearInterval(countInterval);
    countInterval = setInterval(count, 1000);
};

const save = () => {
    localStorage.setItem("2060__save", `${level}:${xp}`);
}

const load = () => {
    const raw = localStorage.getItem("2060__save");
    if(!raw) return;
    ([ level, xp ] = raw.split(":").map(Number));
}

load();

const ANIMATION_DURATION = 100;
const ANIMATION_TILE_WIDTH = 124.8;
const ANIMATION_TILE_UNIT = "px";

const MSG_ANIMATION_DURATION = 1000;

const msg = txt => {
    const h1 = document.querySelector("#msg") as HTMLHeadingElement;
    h1.innerText = txt;
    h1.classList.add("appear");
    setTimeout(() => h1.classList.remove("appear"), MSG_ANIMATION_DURATION);
}

const cycle = () => {
    xp += game.currentState.score;
    while(xp >= (levels[level] ?? Infinity)) {
        xp -= levels[level];
        level++;
    }
    save();

    updatePowerups();

    reset();
    render();
};

const powerupContainer = document.querySelector("#powerups") as HTMLDivElement;

const updatePowerups = () => {
    disabledPowerups = [];
    for(const child of Array.from(powerupContainer.children))
        child.remove();

    const header = document.createElement("h1");
    header.innerText = "Powerups";
    powerupContainer.appendChild(header); 

    for(let powerupI = 0; powerupI < powerups.length; powerupI++) {
        const powerup = powerups[powerupI];
        const powerupDiv = document.createElement("div");
        powerupDiv.innerText = powerup.name;
        if(level < powerup.minLevel)
            powerupDiv.classList.add("disabled")
        // TODO: handle disabling powerups per game
        else if(powerup.type === "simple")
            powerupDiv.addEventListener("click", () => {
                if(disabledPowerups.includes(powerupI)) return;
                game.currentState = powerup.callback(game.currentState);
                render();
                disabledPowerups.push(powerupI);
                powerupDiv.classList.add("disabled");
            });
        else
            powerupDiv.addEventListener("click", () => {
                if(disabledPowerups.includes(powerupI)) return;
                lastCallback = powerup.callback;
                disabledPowerups.push(powerupI);
                powerupDiv.classList.add("disabled");
            });
        powerupContainer.appendChild(powerupDiv);
    }
};

updatePowerups();

const count = () => {
    seconds--;
    if(seconds <= 0) cycle();
    (document.querySelector("#time") as HTMLHeadingElement).innerText = `${seconds}s`;
};

countInterval = setInterval(count, 1000);

const move = (direction: Direction) => {
    const oldState = { ...game.currentState };
    if(renderTimeout !== null) {
        render();
        clearTimeout(renderTimeout);
    }

    game.move(direction);

    if(!game.currentState.status.hasPossibleMoves) {
        msg(strings.gameOverNoXP);
        reset();
        render();
    }
    const newState = { ...game.currentState };

    for(let x = 0; x < 4; x++)
        for(let y = 0; y < 4; y++) {
            const newTile = newState.board[y][x];
            if(newTile === null) continue;
            for(let nx = 0; nx < 4; nx++)
                for(let ny = 0; ny < 4; ny++) {
                    const oldTile = oldState.board[ny][nx];
                    if(oldTile === null) continue;
                    if(oldTile.id === newTile.id || oldTile.id === newTile.mergedId)
                        (blocks[ny * 4 + nx].children[0] as HTMLDivElement).style.transform =
                            `translate(${ANIMATION_TILE_WIDTH * (x - nx)}${ANIMATION_TILE_UNIT}, ${ANIMATION_TILE_WIDTH * (y - ny)}${ANIMATION_TILE_UNIT})`;
                }
        }

    renderTimeout = setTimeout(() => {
        render();
        renderTimeout = null;
    }, ANIMATION_DURATION);
}

render();

document.addEventListener("keydown", e => {
    if(e.key === "ArrowUp" || e.key === "w")
        move(Direction.UP);
    else if(e.key === "ArrowDown" || e.key === "s")
        move(Direction.DOWN);
    else if(e.key === "ArrowLeft" || e.key === "a")
        move(Direction.LEFT);
    else if(e.key === "ArrowRight" || e.key === "d")
        move(Direction.RIGHT);

    if(!game.currentState.status.hasPossibleMoves) reset();
});