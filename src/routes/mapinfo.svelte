<script>
	import { onMount } from "svelte";

	var stats = {};

	let rerun_id;
	let countdown = 0;
	let dotcount = 1;
	async function getstats() {
		const response = await fetch("/api", {
			method: "GET",
			headers: {
				"content-type": "application/json",
			},
		});

		stats = await response.json();

		if (response.status !== 200) {
			setTimeout(
				() => {
					console.log("Attempting to connect to server...");

					if (dotcount >= 3) {
						dotcount = 1;
					} else ++dotcount;
				},
				(document.hidden ? 20 : 5) * 1000
			);
		} else {
			clearTimeout(rerun_id);
			(function countfunc() {
				if (!document.hidden) {
					++countdown;

					if (countdown >= 10) {
						countdown = 0;
						console.log("Checking for server updates...");
						getstats();
						return;
					}
				}

				rerun_id = setTimeout(countfunc, 1000);
			})();
		}

		return response.status;
	}

	// https://stackoverflow.com/a/196991/11433667 CC BY-SA 4.0
	function toTitleCase(str) {
		return str.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
	}

	var time_elapsed = 0;
	let old;
	onMount(() => {
		clearTimeout(old);

		(function updateElapsed() {
			if ("current_map" in stats) {
				time_elapsed = time_elapsed + 1;
			}

			old = setTimeout(() => {
				updateElapsed();
			}, 1000);
		})();
	});
</script>

<!--
{
	"current_map" :
	{
		"name" : "Big Ocean",
		"start_time" : 1727739078.0,
		"technical_name" : "big_ocean"
	},
	"current_mode" :
	{
		"matches" : 3.0,
		"matches_played" : 0.0,
		"name" : "classic"
	},
	"player_info" :
	{
		"count" : 1.0,
		"players" :
		[
			"LandarVargan"
		]
	}
}
-->

<div id="MapInfo">
	{#await getstats(dotcount)}
		<p>Loading Server Stats...</p>
	{:then status}
		{#if status == 200 && "current_map" in stats}
			{@const src =
				"https://github.com/MT-CTF/maps/blob/master/" + stats.current_map.technical_name + "/screenshot.png?raw=true"}
			{@const matchtime = new Date(new Date().getTime() - stats.current_map.start_time * 1000 + time_elapsed)}
			<h2 style="text-align: center;">
				Current Mode: {toTitleCase(stats.current_mode.name)} | {stats.current_mode.matches_played}/{stats.current_mode
					.matches} played
			</h2>

			<div id="map-info">
				<div id="imdiv">
					<div id="map-overlay">
						<h2>{stats.current_map.name}</h2>
						<p>
							<strong>Match Length:</strong>
							{matchtime.getUTCHours() > 0 ? String(matchtime.getUTCHours()).padStart(2, "0") + ":" : ""}{String(
								matchtime.getUTCMinutes()
							).padStart(matchtime.getUTCHours() > 0 ? 2 : 1, "0")}:{String(matchtime.getUTCSeconds()).padStart(2, "0")}
							elapsed
						</p>
						<p>
							<strong>Players ({stats.player_info.count}):</strong>
							{#if stats.player_info.players}
								{stats.player_info.players.join(", ")}
							{/if}
						</p>
					</div>
					<img {src} alt={stats.current_map.name} />
				</div>
			</div>
		{:else}
			<p>
				Loading Server Stats{".".repeat(dotcount)} (Waiting for server to start)
			</p>
		{/if}
	{/await}
</div>

<style>
	p {
		text-align: center;
	}

	#map-info {
		margin-left: auto;
		margin-right: auto;

		width: fit-content;
		max-width: 100%;
	}

	#map-info #map-overlay {
		position: absolute;
		display: block;
		width: 100%;
		z-index: 1;
		background-color: rgba(0, 0, 0, 0.8);
	}

	#map-overlay h2 {
		font-family: "SimpleSquare", sans-serif;
		text-shadow: black 2px 2px;
		font-size: 25px;
		margin-left: 12px;
		margin-right: 12px;
	}

	#map-overlay p {
		margin-left: 24px;
		margin-right: 24px;
		text-shadow: black 1px 1px;
	}

	#imdiv {
		position: relative;
		max-width: 100%;

		/* Default size if image isn't loaded */
		width: 800px;
		height: 100%;
		min-height: 160px;
	}

	#map-info img {
		max-width: 800px;
		width: 100%;
		filter: brightness(90%);
	}
</style>
