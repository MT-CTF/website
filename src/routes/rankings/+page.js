import { json } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	let rankings = await fetch("/api/rankings/players");

	if (rankings.status === 200) {
		rankings = await rankings.json();
	} else if (rankings.status === 503) {
		rankings = await rankings.json();
	} else {
		rankings = {};
	}

	return rankings;
}
