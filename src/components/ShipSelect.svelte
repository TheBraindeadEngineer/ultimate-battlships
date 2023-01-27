<script>
    export let ships;
    export let selectedShip;

    let hoverShip = null;

    function handleClick(ship) {
        selectedShip = ship;
        ships[ships.findIndex(s => s.type === ship.type)].pos = [];
    }
</script>

<style>
    ul {
        padding: 0;
        list-style-position: inside;
        list-style-type: circle;
    }

    li {
        padding-left: 20px;
        cursor: pointer;
    }

    .selectedShip {
        color: white;
        background-color: #333;
    }

    .placed {
        list-style-type: disc;
    }

    .sunk {
        text-decoration: line-through;
    }
</style>

<div id="select-container">
    <h3 style="margin-left: 20px">Select Ship</h3>
    <hr>
    <ul>
        {#each ships as ship}
            <li
                on:click={() => handleClick(ship)}
                on:mouseenter={() => hoverShip = ship}
                on:mouseleave={() => hoverShip = null}
                class:selectedShip={selectedShip && selectedShip.type === ship.type}
                class:placed={ship.pos.length > 0}
                class:sunk={ship.hits.length == ship.size}>
                {ship.type.charAt(0).toUpperCase() + ship.type.slice(1)}
                ({ship.size}) {hoverShip && hoverShip.type ===
                ship.type ? " <--" : ""}
            </li>
        {/each}
    </ul>
</div>
