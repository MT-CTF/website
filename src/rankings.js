
import { Redis } from "ioredis";

export var leaderboards = {
	ctf_mode_classes: {},
	ctf_mode_classic: {},
	ctf_mode_nade_fight: {},
};

const redisSTATKEYS = [
	"kills",
	"kill_assists",
	"deaths",
	"score",
	"bounty_kills",
	"flag_captures",
	"flag_attempts",
	"hp_healed",
	"reward_given_to_enemy",
];

export const redis = new Redis({
	host: "127.0.0.1",
	retryStrategy(times)
	{
		const delay = Math.min(times * 10e3, 60e3);

		console.log("\tWaiting for " + (delay / 1e3) + " seconds before retrying...\n");

		return delay;
	},
}).on("error", function (error)
{
	if (error.code === "ECONNREFUSED")
		console.log("\n[NOTICE]: Failed to connect to redis DB");
	else
		console.error(error);
});

// Taken from https://github.com/MT-CTF/ctf-discord-bot/blob/6270aa16f383e1c49f5db3eedd5d2d655596c8d4/src/index.ts#L219C1-L253C2
async function getStats(modename, pname)
{
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


	await Promise.all(
		redisSTATKEYS.map(async (rank) =>
		{
			let val = await redis.zscore(modename + "|" + rank, pname);

			if (val != null)
			{
				if (typeof(output[rank]) == "number")
					val = Math.floor(val);

				output[rank] = val;

				if (rank == "score")
				{
					let place = await redis.zrevrank(modename + "|" + rank, pname);

					output.place = Number(place !== null ? place : Infinity) + 1;
				}
			}
		})
	);

	return output;
}


// Should be called whenever the match changes
const MAX_RANKINGS = 500;
async function update_leaderboards()
{
	console.log("Loading rankings...");

	await Promise.all(Object.keys(leaderboards).map(async function (modename)
	{
		let ranks = await redis.zrange(modename + "|score", 0, MAX_RANKINGS - 1, "WITHSCORES", "REV");

		leaderboards[modename] = new Array;

		for (let [key, value] of ranks.entries())
		{
			if (key % 2 === 0)
			{
				leaderboards[modename].push(await getStats(modename, value));
			}
		}

		console.log("Loaded", leaderboards[modename].length, "rankings for mode", modename);
	}));
}

await update_leaderboards();
