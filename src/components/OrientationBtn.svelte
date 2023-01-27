<script>
    export let orientation;

    function changeOrientation(event) {
        if (event && event.keyCode === 32) {
            orientation = orientation === "horizontal" ? "vertical" : "horizontal"
            return;
        } else if (!event) {
            orientation = orientation === "horizontal" ?
                "vertical" : "horizontal";
        }
    }
</script>

<style>
    h2 {
        cursor: pointer;
        margin-left: 20px;
    }
</style>

<svelte:window on:keydown={(e) => changeOrientation(e)} />
<h2 on:click={() => changeOrientation()}>
    {#if orientation === "horizontal"}
        &rightarrow;
    {:else}
        &downarrow;
    {/if}
    </h2>
