import { error, json } from '@sveltejs/kit';

let data = null;

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	if (data !== null)
		return json(data);
	else
		error(503, 'Try again later, the server hasn\'t published any game data yet');
}

export async function PUT({ url, getClientAddress, request }) {
	if (getClientAddress() !== '::1')
		error(401, "You can only publish game data from localhost");
	else {
		let temp = await request.json();
		data = null;
		data = temp;

		return new Response({ status: 200 });
	}
}