import { error, json } from '@sveltejs/kit';

let data = null;

/** @type {import('./$types').RequestHandler} */
export function GET({ url, getClientAddress, params }) {
	if (!params.file || params.file === "game.json") {
		if (data !== null) {
			console.log("Served game data to " + getClientAddress());
			return json(data);
		}
		else
			error(503, 'Try again later, the server hasn\'t published any game data yet');
	} else {
		console.log("404d request: " + params + " from " + getClientAddress());
		error(404, "Couldn't find that file")
	}
}

export async function PUT({ url, request }) {
	if (url.href === "https://localhost/api" && url.host === url.hostname === "localhost")
		error(401, "You can only publish game data from localhost");
	else {
		let temp = await request.json();
		data = null;
		data = temp;

		return new Response({ status: 200 });
	}
}