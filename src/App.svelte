<script>
    import Grid from "./components/Grid.svelte";
    import ShipSelect from "./components/ShipSelect.svelte";
    import PlacementOption from "./components/PlacementOptions.svelte";
    import OrientationBtn from "./components/OrientationBtn.svelte";
    import StartNew from "./components/StartNew.svelte";
    import WonLost from "./components/WonLost.svelte";

    let states = ["placement", "game"];
    let state = states[0];

    let activePlayer = 'player';

    // prettier-ignore
    let playerShips = [
        { type: "carrier",    size: 5, hits: [], pos: [] },
        { type: "battleship", size: 4, hits: [], pos: [] },
        { type: "cruiser",    size: 3, hits: [], pos: [] },
        { type: "submarine",  size: 3, hits: [], pos: [] },
        { type: "destroyer",  size: 2, hits: [], pos: [] },
    ];

    let opponentShips = [
        { type: "carrier",    size: 5, hits: [], pos: [] },
        { type: "battleship", size: 4, hits: [], pos: [] },
        { type: "cruiser",    size: 3, hits: [], pos: [] },
        { type: "submarine",  size: 3, hits: [], pos: [] },
        { type: "destroyer",  size: 2, hits: [], pos: [] },
    ];

    let playerGuesses = {hits: [], misses: []};

    let opponentGuesses = {hits: [], misses: []};

    let opponentPossibleGuesses = [];

    createGuesses();

    function createGuesses() {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                opponentPossibleGuesses = [...opponentPossibleGuesses, `${x}${y}`];
            }
        }
    }

    $: numOfShipsPlaced = playerShips.filter(s => s.pos.length > 1).length;

    let selectedShip = null;
    let orientation = "horizontal";
    let hasOverlap = false;
    let playerGridEl;
    let opponentGridEl;
    let messagesEl;

    function reset() {
        state = states[0]
        playerShips = [
            { type: "carrier",    size: 5, hits: [], pos: [] },
            { type: "battleship", size: 4, hits: [], pos: [] },
            { type: "cruiser",    size: 3, hits: [], pos: [] },
            { type: "submarine",  size: 3, hits: [], pos: [] },
            { type: "destroyer",  size: 2, hits: [], pos: [] },
        ];
        opponentShips = [
            { type: "carrier",    size: 5, hits: [], pos: [] },
            { type: "battleship", size: 4, hits: [], pos: [] },
            { type: "cruiser",    size: 3, hits: [], pos: [] },
            { type: "submarine",  size: 3, hits: [], pos: [] },
            { type: "destroyer",  size: 2, hits: [], pos: [] },
        ];
        playerGuesses = {hits: [], misses: []}
        opponentGuesses = {hits: [], misses: []}
    }

    function clearShips() {
        playerShips = playerShips.map(s => {
            return {...s, pos: []}
        })
    }

    $: canStartGame = numOfShipsPlaced == 5 && state == "placement" ? true : false;

    function handleStart() {
        if (canStartGame) {
            state = states[1]
            opponentGridEl.placeRandom();
        }
        messagesEl.startGameMsg(canStartGame);
    }

    $: winner = () => {
        if (playerShips.map(s => s.hits).flat().length == 17) {
            return 'opponent'
        } else if (opponentShips.map(s => s.hits).flat().length == 17) {
            return 'player'
        }
    }

    function opponentTurn() {
        let randIndex = Math.floor(Math.random() *
            opponentPossibleGuesses.length);
        let randPos = opponentPossibleGuesses.splice(randIndex, 1)[0];

        let hit = false;

        playerShips.forEach((s, i) => {
            if (s.pos.includes(randPos)) {
                playerShips[i] = {...s, hits:[...s.hits, randPos]};
                hit = true;
            }
        })
        if (!hit ) opponentGuesses = {...opponentGuesses,
            misses:[...opponentGuesses.misses, randPos] };
        activePlayer = "player";
    }

    $: if (activePlayer == 'opponent') setTimeout(() => opponentTurn(), 1000)

    function handleTurn(e) {
        playerGuesses = e.guesses;
        activePlayer = e.activePlayer;
    }
</script>

<style>
    #title {
        width: 720px;
        display: flex;
        justify-content: space-between;
        margin: auto;
        margin-bottom: 20px;
    }

    #game-container {
        width: 720px;
        height: 640px;
        margin: auto;
        display: grid;
        grid-gap: 30px;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(8, 1fr);
        grid-template-areas:
            "a a a a a a b b b"
            "a a a a a a b b b"
            "a a a a a a b b b"
            "a a a a a a b b b"
            "a a a a a a e e e"
            "a a a a a a d d d"
            "c c c c c c d d d"
            "c c c c c c d d d"
    }

    :global([ref=grid-1]) {
        grid-area: a;
    }

    :global([ref=grid-2]) {
        grid-area: d;
    }

    #ship-placement {
        grid-area: b;
    }

    :global([ref=messages]) {
        grid-area: c;
    }

    :global([ref=startNew]) {
        grid-area: e;
    }

    .disable {
        pointer-events: none;
    }
</style>

    <div id="title">
        <h1>B</h1>
        <h1>A</h1>
        <h1>T</h1>
        <h1>T</h1>
        <h1>L</h1>
        <h1>E</h1>
        <h1>S</h1>
        <h1>H</h1>
        <h1>I</h1>
        <h1>P</h1>
    </div>
<div id="game-container">
    <Grid
        ref={state == "placement" ? 'grid-1' : 'grid-2'}
        bind:this={playerGridEl}
        bind:selectedShip {orientation}
        bind:hasOverlap bind:ships={playerShips}
        guesses={opponentGuesses}
        {state}
    />

    <div id="ship-placement" class:disable={state == 'game'}>
        <ShipSelect bind:ships={playerShips} bind:selectedShip />
        <hr>
        <PlacementOption on:clear={() => clearShips()} on:random={() =>
            playerGridEl.placeRandom()} {state}></PlacementOption>
        <hr>
        <OrientationBtn bind:orientation />
    </div>

    <Grid ref={state == "placement" ? 'grid-2' : 'grid-1'}
        bind:this={opponentGridEl} bind:ships={opponentShips} {state}
        hideShips={true} on:turn={(e) => handleTurn(e.detail)}
        guesses={playerGuesses}
        {activePlayer}
    />

    <StartNew ref="startNew" on:start={() => handleStart()} on:newGame={() =>
        reset()} {canStartGame} {state} ></StartNew>

    {#if winner()}
        <WonLost ref="grid-1" {winner}></WonLost>
    {/if}
</div>
