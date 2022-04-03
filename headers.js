// TODO: Finish capitalizing, Please do this ENDER
const delHeaders = ['Cache-Control', 'Content-Security-Policy', 'Content-Encoding', 'Content-Length', 'cross-origin-opener-policy', 'cross-origin-opener-policy-report-only', 'report-to', 'strict-transport-security', 'x-content-type-options', 'x-frame-options'];

function filterHeaders(headers) {
	for (let header of delHeaders)
		delete headers[header]
	
	return headers;
}

export { filterHeaders };
