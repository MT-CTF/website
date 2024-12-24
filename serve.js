// Credit to https://stackoverflow.com/a/77872825/11433667

import fs from 'fs';
import http from 'http';
import https from 'https';
import { parse } from 'url';

import { handler } from './build/handler.js';

/** @type {https.ServerOptions} */
const httpsOptions = {
	key: fs.readFileSync('./cert.key'),
	cert: fs.readFileSync('./cert.crt'),
};

// Create the HTTPS server
const httpsServer = https.createServer(httpsOptions, (req, res) => {
	const parsedUrl = parse(req.url, true);

	// Check if the request is for the health check
	if (parsedUrl.pathname === '/healthcheck') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');
	} else {
		// Let SvelteKit handle all other requests
		handler(req, res);
	}
});

const httpsPort = 443;
httpsServer.listen(httpsPort, () => {
	console.log(`HTTPS server listening on port ${httpsPort}`);
});

// Create an HTTP server that redirects all traffic to HTTPS
const httpServer = http.createServer((req, res) => {
	const parsedUrl = parse(req.url, true);

	// Check if the request is for the health check
	if (parsedUrl.pathname === '/healthcheck') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');
	} else {
		// Let SvelteKit handle all other requests
		handler(req, res);
	}

	// filter out port from req.headers.host
	// const host = req.headers.host.split(':')[0];
	// const httpsRedirectUrl = `https://${host}:${httpsPort}${req.url}`;
	// res.writeHead(301, { Location: httpsRedirectUrl });
	// res.end();
});

const redirectPort = 80;
httpServer.listen(redirectPort, () => {
	console.log(`HTTP server listening on port ${redirectPort} and redirecting to HTTPS`);
});