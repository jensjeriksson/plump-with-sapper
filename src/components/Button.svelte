<script>
    import Spinner from 'svelte-spinner'
    export let loading = false;
</script>


<button>
    {#if loading}
        <Spinner size="16" color="#92a8d1" />
    {:else}
        <slot></slot>
    {/if}
</button>