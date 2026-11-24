const fs = require('fs');
const os = require('os');
const {spawn, execSync} = require('child_process');
const path = require('path');
const pubsub = require('electron-pubsub');

require('dotenv').config({path: path.join(__dirname, '..', '.env')});

const list = (value, fallback) => (value || fallback || '').split(',').map(s => s.trim()).filter(Boolean);


const SUDOERS_FILE = '/etc/sudoers.d/sshuttle_gui_auto';

if (!fs.existsSync(SUDOERS_FILE)) {
	console.log('Adding to sudoers file');
	// sshuttle 1.x only prints the sudoers config; validate and install it ourselves.
	const tmp = path.join(os.tmpdir(), `sshuttle_gui_sudoers_${process.pid}`);
	try {
		const config = execSync('sshuttle --sudoers-no-modify', {env: process.env});
		fs.writeFileSync(tmp, config, {mode: 0o600});
		execSync(
			`sudo sh -c 'visudo -cf "${tmp}" && install -m 0440 -o root -g wheel "${tmp}" "${SUDOERS_FILE}"'`,
			{env: process.env, stdio: 'inherit'}
		);
		console.log('sudoers file installed:', SUDOERS_FILE);
	} finally {
		fs.rmSync(tmp, {force: true});
	}
}

var events = function(manager){
	
	manager.process.stdout.on('data', function(data){
		console.log('sshuttle out:', data.toString());
	});

	manager.process.stderr.on('data', function(data){
	 	console.error('sshuttle error:', data.toString());
	 	if(data.toString().match(/(client|c) ?: Connected/)){
	 		console.info('sshuttle connected!!!');
	 		pubsub.publish('sshuttle.connected')
	 	}
	});

	manager.process.on('exit', function(code){
		// console.error('sshuttle exit:', code.toString());
		pubsub.publish('sshuttle.exit')
	});
};

var manager = function(options){
	options = options || {};
	let remote = options.remote || process.env.SSHUTTLE_REMOTE;
	let dns = options.dns !== undefined ? options.dns : !/^(false|0|no|off)$/i.test(process.env.SSHUTTLE_DNS || '');
	let user = options.user || process.env.SSHUTTLE_USER;
	let host = options.host || process.env.SSHUTTLE_HOST;
	let port = options.port || process.env.SSHUTTLE_PORT;
	let subnets = list(options.subnets || process.env.SSHUTTLE_SUBNETS, '0/0');
	let excludes = list(options.excludes || process.env.SSHUTTLE_EXCLUDE);

	if(!remote){
		if(!user || !host){
			throw new Error('Set SSHUTTLE_REMOTE, or both SSHUTTLE_USER and SSHUTTLE_HOST, in .env (see .env.example)');
		}
		remote = `${user}@${host}${port ? ':' + port : ''}`;
	}

	// Called without `new`, so `this` would be the global object; use our own.
	const self = {process: null, events: null};

	self.start = function(){
		console.info('starting sshuttle');
		if(!self.process){
			console.info('starting sshuttle...');

			self.process = spawn('sshuttle', [
					...(dns ? ['--dns'] : []), '-r', remote, ...subnets,
					...excludes.flatMap(x => ['-x', x])
				],{env: process.env});
			self.events = events(self);
			pubsub.publish('sshuttle.starting', options);
		}
	};

	self.stop = function(){
		if(self.process){
			self.process.kill();
			self.process = null;
			self.events = null;
		}
	};

	return self;
};

module.exports = manager;
