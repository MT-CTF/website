//
// Create named pipe
//

import { mkfifo } from "mkfifo";
import fs from "node:fs/promises";
import { constants, unlinkSync } from "node:fs";
import path from "node:path";

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

const CTF_FIFO = process.env.CTF_FIFO || "/tmp/ctf_fifo/";
const CTFIN = path.resolve(CTF_FIFO, "ctf_in");  // To CTF
const CTFOUT = path.resolve(CTF_FIFO, "ctf_out"); // From CTF

function process_error(pipe, err)
{
	if (err)
	{
		switch (err.errno)
		{
			case 17: // Already Exists
				console.log("[mkfifo - " + pipe + "] Already exists!");
				break;

			default:
				console.log("[mkfifo - " + pipe + "] ERROR: " + err.errstr);
				return;
		}
	}
	else
	{
		console.log("[mkfifo - " + pipe + "] created!");
	}
}

const errorin = await new Promise(function (resolve, reject)
{
	mkfifo(CTFIN, 0o664, function (mkfifoerror)
	{
		resolve(mkfifoerror);
	});

	setTimeout(function () { reject("mkfifo timeout"); }, 1e3);
});

const errorout = await new Promise(function (resolve, reject)
{
	mkfifo(CTFOUT, 0o664, function (mkfifoerror)
	{
		resolve(mkfifoerror);
	});

	setTimeout(function () { reject("mkfifo timeout"); }, 1e3);
});

// Read from CTF_OUT Pipe

async function readCTFOUT()
{

	while (true)
	{
		console.log("readCTFOUT(): Reading from CTF_OUT...");

		try
		{
			const pipe = await fs.open(CTFOUT, constants.O_RDONLY);

			console.log("readCTFOUT(): Pipe opened, waiting for data...");

			const rawData = await pipe.readFile("utf8");

			ctf_data = JSON.parse(rawData);
			ctf_data["_last_fetch"] = Date.now();

			console.log("readCTFOUT(): Got data: ", ctf_data);

			await pipe.close();
			console.log("readCTFOUT(): Pipe closed");
		}
		catch (error)
		{
			console.error("Error reading pipe:", error);
			throw error;
		}
	}
}

export function init_ctfpipe()
{
	process_error(CTFIN, errorin);
	process_error(CTFOUT, errorout);

	readCTFOUT();
}

export function close_ctfpipe()
{
	try
	{
		unlinkSync(CTFIN);
		unlinkSync(CTFOUT);
		console.log("[mkfifo] Closed pipes");
	}
	catch (err)
	{
		console.error("Error closing pipes:", err);
	}
}