<script module>
	export { rank_card };

	import { redisSTATKEYS, technicalToName } from "$lib/rankings.js";
</script>

{#snippet rank_card(statspromise, player, place)}
	{#await statspromise}
		<td>{place + 1} </td>
		<td>{player}</td>
		{#each redisSTATKEYS as key}
			<td>...</td>
		{/each}
	{:then stats}
		<td>{place + 1} </td>
		<td>
			{player}
		</td>
		{#each redisSTATKEYS as key}
			<td title="{technicalToName(key)}">{Math.round(stats[key])}</td>
		{/each}
	{:catch error}
		<p>[{place + 1}] {error}</p>
	{/await}
{/snippet}
