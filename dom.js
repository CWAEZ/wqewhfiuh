import { scope } from './scope.js' 

// FIXME: This doesn't work with nested nodes infact right now it doesn't even work
// WHYYYY isn't this working!!!
new MutationObserver((mutations, observer) => {
	for (let mutation of mutations)
		for (let node of mutation.addedNodes) {
			let stack = [node];

			while (node = stack.pop()) {
				// No need for hashing since it's already safe
				if (node.integrity) {
					element.removeAttribute('integrity');
					node._integrity = node.integrity
				}
				
				switch (node.tagName) {
				case 'META':
					switch (node.httpEquiv) {
						case 'content-security-policy':
						// TODO: Rewrite	
						node.content = '';
						case 'refresh':
							node.content = node.content.replace(/[0-9]+;url=(.*)/g, `${prefix}/$1`)
					}
				case 'SCRIPT':
					const clone = document.createElement('script');
					
					clone.innerText = scope(node.innerText);

					node.after(clone);

					node.remove();
				}
			}
		}
}).observe(document, {
	childList: true,
	subtree: true
});