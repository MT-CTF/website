
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import fastifyRedis from "@fastify/redis";
import fastifyCaching from "@fastify/caching";
import IORedis from "ioredis";
import abstractCache from "abstract-cache";
import createCacheClient from "abstract-cache-redis";

import path from "node:path";
import fs from "fs";

import fastifyView from "@fastify/view";
import { Eta } from "eta";

import { ctf_data, init_ctfpipe, close_ctfpipe } from "./src/ctfpipe.js";
import { redis, leaderboards } from "./src/rankings.js";

import minifier from "html-minifier-terser";

const minifierOpts = {
	removeComments: true,
	removeCommentsFromCDATA: true,
	collapseWhitespace: true,
	collapseBooleanAttributes: true,
	removeAttributeQuotes: true,
	removeEmptyAttributes: true
};

const DEV = process.env.DEV == "true";
const CERT_PATH = process.env.CERT_PATH; // e.g: /etc/letsencrypt/live/ctf.landarvargan.xyz/

const HOST = DEV ? "localhost" : "0.0.0.0";
const PORT = DEV ? 8080 : 443;

if (!DEV && !CERT_PATH)
{
	throw new Error("CERT_PATH env var not provided!");
}

const website_redis = new IORedis({ host: process.env.WEBSITE_REDIS_HOST || "127.0.0.1" });
const website_cache = abstractCache({
	useAwait: false,
	driver: {
		name: "abstract-cache-redis",
		options: { client: website_redis }
	}
});

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

await fastify.register(fastifyRedis, { client: website_redis });

await fastify.register(fastifyCaching, {
	cache: website_cache
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
	options: {
		useHtmlMinifier: minifier,
		htmlMinifierOptions: minifierOpts
	}
});

fastify.get("/*", function (req, reply)
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

		console.log("Hashing page & params..");

		const hasher = new Bun.CryptoHasher("sha256");

		hasher.update(requested_page);

		if (req.query && Object.keys(req.query).length > 0)
		{
			let queryparams = JSON.stringify(Object.fromEntries(Object.entries(req.query).sort(function (a, b)
			{
				return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
			})));

			console.log("Stringified params: ", queryparams);
			hasher.update(queryparams);
		}

		let cacheKey = hasher.digest("base64");

		console.log("cacheKey is:", cacheKey);

		reply.type('text/html');

		// Skip cache for certain pages
		if (requested_page === "index.eta") {
			return reply.viewAsync(
				path.join("www", files[requested_idx]),
				data,
				{ layout: "www/layout.eta" }
			)
		}

		return new Promise(function (resolve, reject)
		{
			fastify.cache.get(cacheKey, function (error, cache)
			{
				if (error)
					console.error(error);

				if (cache?.item?.pageCache)
				{
					console.log("Page is cached, loading...", cache.item.pageCache);
					resolve(cache.item.pageCache);
				}
				else
				{
					console.log("Page isn't cached yet, saving one...");

					let html = reply.viewAsync(
						path.join("www", files[requested_idx]),
						data,
						{ layout: "www/layout.eta" }
					).then(function (html)
					{
						fastify.cache.set(
							cacheKey,
							{ pageCache: html },
							6e4 * 10, // 10 min
							function (error)
							{
								if (error)
									console.error(error);
								else
									console.log("Save to cache successful");
							}
						);

						console.log("Showing page...");

						resolve(html);
					}).catch(function (error)
					{
						console.error(error);
						resolve(error);
					});
				}
			});
		});
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
	init_ctfpipe();
});

fastify.addHook("onClose", function ()
{
	redis.quit();
	// website_redis.quit();
	close_ctfpipe();
});

process.on('SIGINT', async () =>
{
	await fastify.close();
	process.exit(0);
});

process.on('SIGTERM', async () =>
{
	await fastify.close();
	process.exit(0);
});