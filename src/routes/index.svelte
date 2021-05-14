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
	/*
* Prefixed by https://autoprefixer.github.io
* PostCSS: v7.0.29,
* Autoprefixer: v9.7.6
* Browsers: last 4 version
*/

section {
		width: 100%;
		height: 100%;
		display: -webkit-box;
		display: -ms-flexbox;
		display: flex;
		-webkit-box-orient: vertical;
		-webkit-box-direction: normal;
		    -ms-flex-direction: column;
		        flex-direction: column;
		-webkit-box-align: center;
		    -ms-flex-align: center;
		        align-items: center;
		-webkit-box-pack: start;
		    -ms-flex-pack: start;
		        justify-content: flex-start;
		padding-top: 10%;
	}
</style>
