// Prefix every console.log/info/warn/error line with a local ISO-like timestamp.
const pad = n => String(n).padStart(2, '0');

const stamp = () => {
	const d = new Date();
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
		`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

for (const method of ['log', 'info', 'warn', 'error']) {
	const original = console[method].bind(console);
	console[method] = (...args) => original(`[${stamp()}]`, ...args);
}
