<script>
	import MapInfo from "./mapinfo.svelte";
</script>

<div class="container content">
	<h1 style="text-align: center;">Capture the Flag game powered by the Minetest voxel engine</h1>
	<div id="server-address">
		Address:
		<code>ctf.rubenwardy.com</code>
		Port:
		<code>30001</code>
	</div>

	<p class="links">
		<a href="https://github.com/MT-CTF/capturetheflag">Source Code</a> |
		<a href="https://github.com/MT-CTF/capturetheflag/issues">Issue Tracker</a>
		|
		<a href="https://github.com/MT-CTF/capturetheflag/projects/2">Road Map</a>
		|
		<a href="https://forum.minetest.net/viewtopic.php?f=10&t=13157">Server Forum Topic</a>
	</p>

	<div style="margin: 0px auto; width: fit-content;">
		<a class="shield" href="https://discord.gg/vcZTRPX">
			<img
				alt="Discord"
				src="https://img.shields.io/discord/447819017391046687?color=blue&label=Join%20the%20Discord&logo=discord&logoColor=blue"
			/>
		</a>
		<a class="shield" href="https://content.minetest.net/packages/rubenwardy/capturetheflag/">
			<img alt="ContentDB" src="https://content.minetest.net/packages/rubenwardy/capturetheflag/shields/downloads/" />
		</a>
	</div>

	<MapInfo />
</div>

<style>
	div#server-address {
		align-self: center;
		text-align: center;
		font-size: 1.5em;

		padding: 12px;
		width: 100%;
	}

	:global(#MapInfo) {
		width: calc(100% - 24px);
		padding: 0px 12px 12px 12px;
		border-top: 3px var(--background-border-color) solid;

		margin-top: 24px;
	}

	div#server-address code {
		display: inline-block;
		user-select: all;
	}

	.links {
		padding-top: 12px;
		font-size: 1.2em;
		text-align: center;
	}
</style>
