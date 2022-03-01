'use strict';

// Don't wait for the old service workers
self.addEventListener('install', () => self.skipWaiting());

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

var ctx = {
	http: {
		prefix: '/http/'
	},
	ws: {
		prefix: '/ws/'
	},
	codec: 'plain'
}

let delHeaders = ['cache-control', 'content-security-policy', 'content-encoding', 'content-length', 'cross-origin-opener-policy-report-only', 'cross-origin-opener-policy', 'report-to', 'strict-transport-security', 'permissions-policy', 'vary', 'x-frame-options', 'x-content-type-options'];

function filterHeaders(headers) {
	return Object.fromEntries([...headers].filter(([header]) => delHeaders.indexOf(header) === -1));
}

self.addEventListener('fetch', event => {
	const response = await fetch(url, {
			body: event.request.body,
			bodyUsed: event.request.bodyUsed,
			headers: {
				...event.request.headers,
				_Referer: origin
			},
			method: event.request.method,
			mode: event.request.mode,
			// Don't cache
			cache: "no-store"
	});
	let text = await response.text();
	
	origin = new URL(event.request.url.split(location.origin + ctx.http.prefix)[1]).origin;
	
	event.respondWith(async function() {
		if (event.request.mode === 'navigate') { 
			ctx.origin = origin;

			return new Response(event.request.destination === 'document' ? `
				<!DOCTYPE html>
				<head>
					<script id=ctx type="application/json">${JSON.stringify(ctx)}</script>
					<script src=aero/inject.js type=module>
					<script src=aero/gel.js>
					${text.replace(/<meta[^>]+>/g, '').replace(/integrity/g, '_integrity').replace(/location/gms, '_location').replace(/rel=["']?preload["']?/g, '').replace(/rel=["']?preconnect["']?/g, '').replace(/rel=["']?prefetch["']?/g, '')}
				</head>
			` : response.body, {
				statusText: response.statusText,
				headers: filterHeaders(headers)
			});
		}

		const originSplit = event.request.url.split(location.origin);

		if (originSplit[originSplit.length - 1].startsWith('aero'))
			return fetch(event.request.url);

		if (event.request.url.startsWith('data:')) {
			var url = event.request.url;
		} else {
			var url = location.origin + ctx.http.prefix;

			if (originSplit.length === 1)
				url += originSplit[0];
			else {
				const prefixSplit = originSplit[1].split(ctx.http.prefix);

				// If the url is already valid then don't do anything
				if (prefixSplit.length === 2 && prefixSplit[1].startsWith(url))
					url += prefixSplit[1];
				else {
					const prefix = prefixSplit[prefixSplit.length - 1];
					
					const protocolSplit = prefix.startsWith('https:/') ? prefix.split('https:/') : prefix.split('http:/');

					const pathSplit = protocolSplit[protocolSplit.length - 1].split('/' + new URL(origin).hostname);
					const path = pathSplit[pathSplit.length - 1];

					const dotSplit = path.split('/')[1].split('.');

					// If another origin
					if (dotSplit.length === 2 && protocolSplit.length === 3)
						url += 'https:/' + path;
					else
						url += origin + path;
				}
			}
		}

		// CORS testing
		try {
			const controller = new AbortController();
			const signal = controller.signal;

			await fetch(url, { signal });

			// Don't actually send the request.
			controller.abort()
		} catch (err) {
			if (err.name !== 'AbortError')
				// Report CORS error
				throw err;
		}

		console.log(`%csw%c ${event.request.url} %c${event.request.destination} %c->%c ${url}`, 'color: dodgerBlue', '', 'color: yellow', 'color: mediumPurple', '');

		if (event.request.destination === 'script')
			text = text.replace(/location/gms, '_location');

		return new Response(text, {
			status: response.status,
			statusText: response.statusText,
			headers: headers
		});
	}());
});
