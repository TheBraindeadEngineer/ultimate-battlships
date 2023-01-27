<script>
    import { fade } from 'svelte/transition';
    export let ref;
    export let winner;
</script>

<style>
    #message-container {
        background-color: rgba(255, 255, 255, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .message {
        width: 50%;
        display: flex;
        justify-content: space-between;
    }
</style>

<div {ref} transition:fade id="message-container">
    {#if winner() == 'player'}
        <div class="message">
            <h1>Y O U</h1>
            <h1>W O N !</h1>
        </div>
    {:else}
        <div class="message">
            <h1>Y O U</h1>
            <h1>L O S T !</h1>
        </div>
    {/if}
</div>
