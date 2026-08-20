//
// Create named pipe
//

import { mkfifo } from "mkfifo";
import fs from 'node:fs/promises';

const CTFIN = "/tmp/ctf_fifo/ctf_in";  // To CTF
const CTFOUT = "/tmp/ctf_fifo/ctf_out"; // From CTF

export var ctf_data; /* = {
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
};
// */

function process_error(pipe, err)
{
	if (err)
	{
		switch (err.errno)
		{
			case 17: // Already Exists
				break;

			default:
				console.log("[mkfifo - " + pipe + "] ERROR: " + err.errstr);
				return;
		}
	}
}

const errorin = await new Promise(function (resolve, reject)
{
	mkfifo(CTFIN, 0o600, function (mkfifoerror)
	{
		resolve(mkfifoerror);
	});

	setTimeout(function () { reject("mkfifo timeout"); }, 1e3);
});

const errorout = await new Promise(function (resolve, reject)
{
	mkfifo(CTFOUT, 0o600, function (mkfifoerror)
	{
		resolve(mkfifoerror);
	});

	setTimeout(function () { reject("mkfifo timeout"); }, 1e3);
});

process_error(CTFIN, errorin);
process_error(CTFOUT, errorout);

export async function load_data()
{
	console.log("[load_data] Fetching data from " + CTFOUT + "...")
	let new_data = await fs.readFile(CTFOUT, "utf-8", function (error)
	{
		if (error)
			console.log("[load_data] Error: ", error);
	});

	try
	{
		ctf_data = JSON.parse(new_data);
		ctf_data["_last_fetch"] = Date.now();
		console.log(ctf_data);
	} catch (error)
	{
		console.log("Failed to parse data from server:", new_data);
	}

	setTimeout(load_data, 30e3);
}