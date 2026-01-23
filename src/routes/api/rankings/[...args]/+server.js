import redis from "redis";
import { error, json } from "@sveltejs/kit";

import { redisSTATKEYS, MODES } from "$lib/rankings.js";

/**
 * Map of maps of player stats per mode
 *
 * eg: statsMap.get("mode_name").get("player_name")
 */
let statsMap = undefined;

// object keyed by technical modename, with a list of player names ordered by rank in each
let statsPlayers = undefined;

/**
 * List of player names in database, used for playername searches
 */
let statsPlayernames = undefined;

let lastUpdated = 0;

const redisClient = redis.createClient({ socket: {host: "redis"} });

async function getStats(mode, pname) {
	let output = {
		name: pname,
		score: 0,
		kills: 0,
		kill_assists: 0,
		deaths: 0,
		bounty_kills: 0,
		flag_attempts: 0,
		flag_captures: 0,
		hp_healed: 0,
		reward_given_to_enemy: 0,
		place: Infinity,
	};

	let has_nonzero = false;

	await Promise.all(
		redisSTATKEYS.map(async (rank) => {
			let val = await redisClient.zScore(mode + "|" + rank, pname);

			if (val != null) {
				output[rank] = val;

				if (rank == "score") {
					let place = await redisClient.zRevRank(mode + "|" + rank, pname);

					output.place = (place !== null ? place : Infinity) + 1;
				}
			}
		})
	);

	return output;
}

async function updateRankings() {
	let newStats = new Map();
	let newStatsPlayernames = [];
	let newStatsPlayers = {
		ctf_mode_classes: [],
		ctf_mode_classic: [],
		ctf_mode_nade_fight: [],
	};

	await Promise.all(
		["ctf_mode_classes", "ctf_mode_classic", "ctf_mode_nade_fight"].map(async (modetech) => {
			// { score: <amount of given rank, which in this case is ctf score (derived from "|score")>, value: <playername> }
			let ranks = await redisClient.zRangeWithScores(modetech + "|score", 0, -1, { REV: true });

			if (newStats.get(modetech) === undefined) {
				newStats.set(modetech, new Map());
			}

			await Promise.all(
				ranks.map(async (vals, place) => {
					let stats = await getStats(modetech, vals.value);

					newStats.get(modetech).set(vals.value, stats);
					newStatsPlayernames.push(vals.value);
					newStatsPlayers[modetech][place] = vals.value;
				})
			);
		})
	);

	statsMap = newStats;

	newStatsPlayernames = [...new Set(newStatsPlayernames)];
	newStatsPlayernames.sort();

	statsPlayers = {
		ctf_mode_classes: newStatsPlayers.ctf_mode_classes.slice(0, 100),
		ctf_mode_classic: newStatsPlayers.ctf_mode_classic.slice(0, 100),
		ctf_mode_nade_fight: newStatsPlayers.ctf_mode_nade_fight.slice(0, 100),
	};
	statsPlayernames = newStatsPlayernames;

	lastUpdated = Date.now();

	console.log("Rankings cache updated");
}

let have_redis = false;
let last_checked = Date.now();
async function connect_to_redis() {
	if (!have_redis) {
		try {
			await redisClient.connect();
			have_redis = true;
			console.log("Successfully connected to redis server");

			await updateRankings();
			setInterval(updateRankings, 60e3);
		} catch (error) {
			console.log("Failed to connect to redis server");
			have_redis = false;
		}
	}

	last_checked = Date.now();

	setTimeout(connect_to_redis, 15e3);
}

setTimeout(connect_to_redis, 1e3);

const INVALID = json({
	connected: true,
	api_options: {
		"List of players": "/api/rankings/[modename]/players",
		"Player ranks:": "/api/rankings/<modename>/player/<playername>",
	},
});

/** @type {import('./$types').RequestHandler} */
export function GET({ url, getClientAddress, params }) {
	if (!have_redis || !statsMap) {
		return error(503, {
			message: "Try again later, this api is not currently connected to the rankings database",
			connected: false,
			last_checked: last_checked,
		});
	} else {
		if (!params || params.args === "") {
			console.log("No params, returning invalid request. params=", params);
			return INVALID;
		}

		params = params.args.split("/", 3);

		let modename = "";
		let requested = "";
		let playername = "";
		if (!params[1] || params[1] === "") {
			//api/rankings/<requested>
			requested = params[0];
		} else if (!params[2] || params[2] === "") {
			//api/rankings/<modename>/<requested>
			modename = params[0];
			requested = params[1];
		} else {
			//api/rankings/<modename>/player/<playername>
			modename = params[0];
			requested = params[1];
			playername = params[2];
		}

		if (modename !== "" && !MODES.includes(modename)) return error(404, "Mode not found");

		if (requested === "players") {
			if (modename === "") {
				return json({
					connected: true,
					last_updated: lastUpdated,
					players: statsPlayers,
				});
			} else if (statsPlayers[modename]) {
				return json({
					connected: true,

					players: statsPlayers[modename],
				});
			}
		} else if (requested === "player" && modename !== "" && statsMap.has(modename)) {
			let rankings = statsMap.get(modename).get(playername);

			if (!rankings) return error(404, "Player not found");

			return json({
				connected: true,
				last_updated: lastUpdated,
				player: rankings,
			});
		}

		console.log("Invalid request: ", params, { modename, requested, playername });
		return INVALID;
	}
}
