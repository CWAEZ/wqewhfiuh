import { prefix, bare } from './config.js'
import { block } from './corsTest.js';
import { scope } from './scope.js';
import { filterHeaders } from './headers.js';

async function handle(event) {
	if (/\/aero\//g.test(url))
		return;

	const url = new URL(event.request.url.split(prefix)[1]);

	//if (block(url))
	//	return;

	console.log(`${event.request.url} -> ${url.href}`);

	// v2 endpoint can be used when bare is updated
	const response = await fetch(`${bare}v1/`, {
		body: event.request.body,
		headers: {
			'x-bare-path': url.pathname,
			'x-bare-host': url.hostname,
			'x-bare-port': '443',
			'x-bare-protocol': url.protocol,
			'x-bare-headers': JSON.stringify({
				...Object.fromEntries(event.request.headers.entries()),
				host: url.hostname
			}),
			'x-bare-forward-headers': '[]'
		},
		method: event.request.method,
		// Don't cache
		cache: 'no-store'
	});

	const bareHeaders = filterHeaders(JSON.parse(response.headers.get('x-bare-headers')));

	let text;
	if (event.request.mode === 'navigate' && event.request.destination === 'document' && bareHeaders['Content-Type'].startsWith('text/html')) {
		text = await response.text();
		if (text !== '')
			text = `
<!DOCTYPE html>
<head>
	<meta charset=utf-8>
	<!--Reset favicon-->
	<link href=data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII= rel="icon" type="image/x-icon"/>

	<script type=module src=/aero/dom.js></script>
	<script type=module src=/aero/window.js></script>
	<script type=module src=/aero/ws.js></script>
</head>

${text}
`;

	} else if (event.request.destination === 'script')
		text = scope(await response.text());
	else if (event.request.destination === 'serviceworker')
		text = `
importScripts('./gel.js');

${text}
		`;
	else
		text = response.body;

	event.respondWith(new Response(text, {
		status: response.status,
		headers: bareHeaders
	}));
}

export { handle };