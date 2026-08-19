
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "fs";
import fastifyView from "@fastify/view";
import { Eta } from "eta";

import { ctf_data } from "./src/ctfpipe.js";
import { redis, leaderboards } from "./src/rankings.js"

const DEV = process.env.DEV == "true";
const CERT_PATH = process.env.CERT_PATH; // e.g: /etc/letsencrypt/live/ctf.landarvargan.xyz/

const HOST = DEV ? "localhost" : "0.0.0.0";
const PORT = DEV ? 8080 : 443;

if (!DEV && !CERT_PATH)
{
	throw new Error("CERT_PATH env var not provided!")
}

const fastify = new Fastify({
	http2: DEV ? undefined : true, // Used for http redirect plugin
	https: DEV ? undefined : {
		allowHTTP1: true, // Used for http redirect plugin
		key: fs.readFileSync(path.resolve(CERT_PATH, "privkey.pem")),
		cert: fs.readFileSync(path.resolve(CERT_PATH, "fullchain.pem")),
	}
});

const eta = new Eta();

await fastify.register(fastifyStatic, {
	root: path.join(import.meta.dirname, "public"),
	prefix: "/public/"
});

const files = fs.readdirSync(path.join(import.meta.dirname, "www"), { withFileTypes: true }).filter(function (file)
{
	return path.basename(file.name) !== "layout.eta" && path.extname(file.name) === ".eta";
}).map(file => file.name);

console.log("Files: ", files);

await fastify.register(fastifyView, {
	engine: { eta },
	production: true,
	templates: import.meta.dirname,
});

fastify.get("/*", (req, reply) =>
{
	let requested_page = String(req.params["*"]);

	if (requested_page === "")
		requested_page = "index.eta";
	else if (path.extname(requested_page) === "")
		requested_page += ".eta";

	console.log("Loading page:", requested_page);

	const requested_idx = files.indexOf(requested_page);
	if (requested_idx != -1)
	{
		const data = {
			stats: ctf_data,
			leaderboards: leaderboards,
			query: req.query,
			current_page: files[requested_idx],
		};

		return reply.viewAsync(
			path.join("www", files[requested_idx]),
			data,
			{ layout: "www/layout.eta" }
		);
	}
	else
	{
		reply.statusCode = 404;
		reply.send("Page not found");
	}
});

fastify.listen({ host: HOST, port: PORT }).then(() =>
{
	console.log("Website listening on host " + HOST + " at port " + PORT);
});

fastify.addHook("onClose", function() {
	redis.quit();
})
