<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let state;

    function handleClick(type) {
        if (state == "placement") dispatch(type)
    }
</script>

<style>
    div {
        padding: 0;
        margin: 0;
        display: inline-block;
        margin-left: 20px;
        cursor: pointer;
        font-size: 30px;
    }

</style>

<div id="options-container">
    <div on:click={() => handleClick('random')}>&#9860;</div>
    <div on:click={() => handleClick("clear")}>&#11034;</div>
</div>
