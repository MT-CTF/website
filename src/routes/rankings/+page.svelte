<script>
	/** @type {import('./$types').PageData} */
	export let data;

	import { inview } from "svelte-inview";
	import { redisSTATKEYS, technicalToName, MODES } from "$lib/rankings.js";
	import { rank_card } from "./rankcard.svelte";

	let current_date = Date.now();

	if (data.connected !== true) {
		setInterval(function () {
			current_date = Date.now();
		}, 1e3);
	}

	let load_queue = {};
	let currently_loading = {};
	let loaded = {};

	for (const mode of MODES) {
		loaded[mode] = {};
		load_queue[mode] = [];
		currently_loading[mode] = -1;
	}

	async function get_player_stats(player, place, mode) {
		let idx = load_queue[mode].indexOf(place);

		if (idx != -1) {
			currently_loading[mode] = load_queue[mode].splice(idx, 1)[0];
			if (currently_loading[mode] != place) {
				throw new Error("Failed to splice load queue array");
			}
		}

		let result = await fetch("/api/rankings/" + mode + "/player/" + player);

		result = await result.json();

		if (!result.player) {
			throw new Error("Failed to fetch rankings for " + player);
		}

		if (loaded[mode] === true || Object.keys(loaded[mode]).length >= 99) {
			loaded[mode] = true;
		} else {
			loaded[mode][place] = true;
		}

		// await new Promise(function (resolve) {
		// 	setTimeout(resolve, 3e3);
		// });

		if (load_queue[mode].length > 0) {
			currently_loading[mode] = load_queue[mode].shift();
		} else {
			currently_loading[mode] = -1;
		}

		return result.player;
	}

	let selected_mode = MODES[0];
</script>

{#if data.connected === true}
	<div class="container content">
		<h1 style="text-align: center;">CTF Rankings</h1>

		<nav id="tabs">
			{#each MODES as mode}
				<button
					class="tab {selected_mode === mode ? 'selected' : ''}"
					on:click={function () {
						selected_mode = mode;
					}}>{technicalToName(mode)}</button
				>
			{/each}
			<p>
				Year: <input type="number" min="2025" max="2025" name="ranking_year" value="2025" />
			</p>
		</nav>

		{#each MODES as mode}
			{#if mode === selected_mode}
				<div id={mode} class="ranklist">
					<table>
						<thead>
							<tr>
								<th></th>
								<th>Playername</th>
								{#each redisSTATKEYS as key}
									<th>{technicalToName(key)}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each data.players[mode] as player, place}
								<tr
									class="rankcard"
									use:inview={{}}
									on:inview_change={function ({ detail }) {
										detail.inView = detail.inView ? true : undefined;

										if (loaded[mode] === true || loaded[mode][place]) {
											detail.observer.disconnect();
											return;
										}

										let idx = load_queue[mode].indexOf(place);
										if (idx == -1) {
											if (detail.inView) {
												if (currently_loading[mode] == -1) {
													currently_loading[mode] = place;
													detail.observer.disconnect();
												} else {
													load_queue[mode].push(place);
												}
											}
										} else if (!detail.inView) {
											load_queue[mode].splice(idx, 1);
										}
									}}
								>
									{#if loaded[mode] === true || loaded[mode][place] || currently_loading[mode] == place}
										{@render rank_card(get_player_stats(player, place, mode), player, place)}
									{:else}
										<td>{place + 1} </td>
										<td>{player}</td>
										{#each redisSTATKEYS as key}
											<td>...</td>
										{/each}
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/each}
	</div>
{:else}
	<p>
		The rankings database is currently down. Last checked: {Math.round((current_date - data.last_checked) / 1e3)} seconds
		ago
	</p>
	{#if (current_date - data.last_checked) / 1e3 > 15}
		<p>Refresh the page to check again.</p>
	{/if}
{/if}

<style>
	#tabs {
		display: flex;
		border-bottom: 1px var(--background-color2) solid;
	}
	#tabs p {
		font-size: large;
		order: 2;
		margin-left: auto;
	}
	#tabs button.tab {
		font-size: large;
		color: var(--text-color);
		border-radius: 0px;
		background-color: var(--button-color);
		border: 1px var(--background-color) solid;
		font-style: inherit;
		padding: 0px 12px;
	}
	#tabs button.tab:hover,
	#tabs button.tab.selected {
		background-color: var(--button-color-hover);
	}
</style>
