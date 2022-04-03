function wrap(url) {
	return prefix + url;
}

let fakeLocation = new URL(location.href.match(/(?<=\/go\/).*/g)[0]);
const locationProxy = new Proxy({}, {
	get(target, prop) {
		if (typeof target[prop] === 'function')
			return {
				assign: url => wrap(url),
				toString: url => fakeLocation.toString(),
				reload: location.reload
			}[prop];
		return fakeLocation[prop];
	},
	set(target, prop, value) {
		if (prop === 'href')
			location[prop] = config.http.prefix + fakeLocation.origin + value;
	}
});
document._location = locationProxy;

Object.defineProperty(document, 'domain', {
	get() {
		return fakeLocation.hostname;
	},
	set(value) {
		return value;
	}
});

var historyState = {
	apply(target, that, args) {
		let [state, title, url = ''] = args;

		return Reflect.apply(...arguments);
	}
};
history.pushState = new Proxy(history.pushState, historyState);
history.replaceState = new Proxy(history.replaceState, historyState);

/*
Navigator.serviceWorker.register = new Proxy(Navigator.serviceWorker.register, {
	apply(target, that, args) {
		args[0] = wrap(args[0]);

		return Reflect.apply(...arguments);
	}
});

Worker = new Proxy(Worker, {
	construct(target, args) {
		return Reflect.construct(target, args);
	}
});
*/

open = new Proxy(open, {
	apply(target, that, args) {
		if (args[0])
			args[0] = wrap(args[0]);

		return Reflect.apply(...arguments);
	}
});

postMessage = new Proxy(postMessage, {
	apply(target, that, args) {
		return Reflect.apply(...arguments);
	}
});

/*
audio = new Proxy(audio, {
	construct(target, args) {
		[url] = args[0];

		if (url)
			url = wrap(url);

		return Reflect.construct(target, args);
	},
});
*/