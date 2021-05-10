<script context="module">
	export const prerender = true;
</script>

<script>
	import Start from '../components/Start.svelte'
</script>

<svelte:head>
	<title>A game of Plump anyone?</title>
</svelte:head>

<section>
	<Start />
</section>

<style>
	section {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding-top: 10%;
	}
</style>
