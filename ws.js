// temporary fix:

const valid_chars =
	"!#$%&'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~";
const reserved_chars = '%';

function validProtocol(protocol) {
	protocol = protocol.toString();

	for (let i = 0; i < protocol.length; i++) {
		const char = protocol[i];

		if (!valid_chars.includes(char)) {
			return false;
		}
	}

	return true;
}

function encodeProtocol(protocol) {
	protocol = protocol.toString();

	let result = '';

	for (let i = 0; i < protocol.length; i++) {
		const char = protocol[i];

		if (valid_chars.includes(char) && !reserved_chars.includes(char)) {
			result += char;
		} else {
			const code = char.charCodeAt();
			result += '%' + code.toString(16).padStart(2, 0);
		}
	}

	return result;
}

function decodeProtocol(protocol) {
	if (typeof protocol != 'string')
		throw new TypeError('protocol must be a string');

	let result = '';

	for (let i = 0; i < protocol.length; i++) {
		const char = protocol[i];

		if (char == '%') {
			const code = parseInt(protocol.slice(i + 1, i + 3), 16);
			const decoded = String.fromCharCode(code);

			result += decoded;
			i += 2;
		} else {
			result += char;
		}
	}

	return result;
}


WebSocket = new Proxy(WebSocket, {
	construct(target, args) {

        var [url] = args;
        
        url = new URL(url);

        let headers = {
            remote: {
                host: url.hostname,
                path: url.pathname+url.search,
                protocol: url.protocol,
                port: url.port?url.port:(url.protocol=='wss:'?443:80)
            },
            headers: {
                Pragma: "no-cache",
                "Cache-Control": "no-cache",
                Upgrade: "websocket",
                Connection: "Upgrade",
                // Don't use this just import config
                Host: new URL(location.href.match(/(?<=\/go\/).*/g)[0]).hostname,
                Origin: new URL(location.href.match(/(?<=\/go\/).*/g)[0]).origin
            }
        }

        let protocol = [
            'bare',
            encodeProtocol(headers)
        ]

        let socket = Reflect.construct(target, [location.protocol.replace('http','ws')+'//'+location.host+'/bare/v1/', protocol]);
        
        return socket;
	}
});

let urlProp = Object.getOwnPropertyDescriptor(WebSocket.prototype, 'url');
        
Object.defineProperty(WebSocket.prototype, 'url', {
    get() {
        var current = urlProp.get.call(this);
        alert(current);
        return current;
    },
    set(val) {
        return val;
    },
});