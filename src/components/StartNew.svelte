<script>
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let ref;
    export let state;
    export let canStartGame;

    let newGame = false;

    function handleNewGame() {
        dispatch('newGame');
        newGame = false;
    }
</script>

<style>
    h3, p {
        padding: 0;
        margin: 0;
    }

    .alert-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }

    #yes-no-container {
        width: 50%;
        display: flex;
        justify-content: space-around;
    }

    .inactive {
        background-color: none;
        color: #333;
        border: 2px dotted #333;
        transition: color 1s, background-color 1s;
    }

    .active {
        border: 2px solid #333;
        box-shadow: 10px 10px 30px #333;
    }

    .yes-no {
        text-align: center;
        width: 50%;
    }

    .yes-no:hover {
        background-color: #333;
        color: white;
    }
</style>

{#if state == "placement"}
    {#if canStartGame}
        <div transition:fade {ref} class="alert-container active" on:click={() =>
            dispatch("start")}>
            <h3>Start Game</h3>
        </div>
    {:else}
        <div transition:fade {ref} class="alert-container inactive" on:click={() =>
            dispatch("start")}>
            <h3>Start Game</h3>
        </div>
    {/if}
{:else}
    {#if newGame}
        <div transition:fade {ref} class="alert-container active">
            <h3>Are you sure?</h3>
            <div id="yes-no-container">
                <p class="yes-no" on:click={() => handleNewGame()}>YES</p>
                <p class="yes-no" on:click={() => newGame = false}>NO</p>
            </div>
        </div>
    {:else}
        <div transition:fade {ref} class="alert-container inactive" on:click={() => newGame = true}>
            <h3>New Game</h3>
        </div>
    {/if}
{/if}
