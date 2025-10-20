//*********************************************************************************************************************
//  Blackwake Activity Monitor Backend [BAMB]
//
//  Author: GRNS | Git: GRNSFI
//
//  Version: v1.0 [STABLE]
//
//  Last updated: 20.10.2025
//
//  Written using Node.js version v22.20.0 [LTS]
//
//*********************************************************************************************************************
//--Needed-NPM-Packages----------------------------------------------------------------------------------------------//
//
//  npm i croner
//  npm i sqlite3
//  npm i sequelize
//  npm i node-fetch
//  npm i log-timestamp
//  npm i steam-server-query
//
//--Notes------------------------------------------------------------------------------------------------------------//
//
//  This application fetches and stores the Blackwake servers data to the database once in a minute. To actually use 
//  the data, you'll need code to query and display it in a frontend application. Use 'dbtest = true' if you want to 
//  see the stored data in the console output.
//
//--EDITABLE-VARIABLES-----------------------------------------------------------------------------------------------//
//
//  Steam API key. If you don't own one, you'll need to get it from https://steamcommunity.com/dev/apikey
//  Without working API key the application won't work.
//
const apiKey = '' // MUST BE EDITED!
//
//  Set to 'true' if you want to see the stored data in the console output. Default: false.
//  NOTICE! It takes few seconds before the output is created after data fetching starts. This ensures that all data
//  gets stored to the database on time.
//
const dbtest = true;
//
//  Set to 'true' if you want to see debug information in the console output. Default: false.
//
const debug = false;
//
//  Add/remove double slashes '//' in front of line below to clear or not clear the console when application starts.
//
console.clear();
//
//-------------------------------------------------------------------------------------------------------------------//
//--WARNING !! EDITING ANYTHING BELOW THIS LINE MAY BREAK THE CODE !!------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------------//
//--Dependencies-----------------------------------------------------------------------------------------------------//
//
const { 

	Sequelize

} = require('sequelize');

const {

	queryGameServerInfo

} = require('steam-server-query');

const Cron  = require('croner').Cron;
const fetch = require('node-fetch').default;
const wait	= require('timers/promises').setTimeout;

require('log-timestamp');
//
//--Database---------------------------------------------------------------------------------------------------------//
//
const sequelize = new Sequelize({
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'bam.sqlite',
});
//
//--Data-Model-------------------------------------------------------------------------------------------------------//
//
const db = sequelize.define('bam', {
	name: 	  	Sequelize.STRING,
	address:  	Sequelize.STRING,
	mode:	  	Sequelize.STRING,
	players:  	Sequelize.INTEGER,
	maxPlayers: Sequelize.INTEGER
});
//
//--Common-Variables-------------------------------------------------------------------------------------------------//
//
const resTime = 5000;
let  keyValid = true;
//
//--BAMB-------------------------------------------------------------------------------------------------------------//
//
(() => {

	db.sync();

	const BAMB = new Cron('* * * * *', async () => {

		try {

			if (keyValid) {
	
				const api = await SteamAPI();
				const serverData = api.response.servers;

				if (serverData.length > 0) {

					await db.drop();
					      db.sync();
						
					for (const data of serverData) {
						
						QueryServer(data);
						await wait(100);
					}
					if (dbtest) Data();
				}
				else {

					if (debug) console.error('No server data fetched from Steam. Cannot store data to the database.');
				}
			} else {

				throw new Error('invalid api key');
			}
		} catch(error) {

			console.error('Error in bamb.js:[BAMB]');

			if (error || error.message === 'invalid api key') {
		
				console.error(`Steam API key missing or invalid. Check the 'apiKey' variable.`);
			}
			else {

        console.error(error);
			}
		}
	});

})();
//
//--Steam-API--------------------------------------------------------------------------------------------------------//
//
async function SteamAPI() {

	const apiStr  = `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${apiKey}&filter=appid\\420290`;

	const promise = new Promise((resolve, reject) => {

		fetch(apiStr).then(res => res.text()).then(response => {

			if (response.includes('Access is denied')) {

				keyValid = false;

				reject('invalid api key');
			}
			else {

				keyValid = true;

				const jsonData = JSON.parse(response);
				resolve(jsonData);
			}
		});
	});
	return await promise;
};
//
//--QueryServer------------------------------------------------------------------------------------------------------//
//
async function QueryServer(data) {
	
	try {

		const server = await queryGameServerInfo(data.addr, 1, resTime).catch(() => {});
		
		if (server) {
							
			let serverName = server.name.substring(7,server.name.length);
			    serverName = serverName.replace(/\sd::\w*/g, '');
			
			await db.create({
				name: 	  	serverName,
				address:  	data.addr,
				mode:	  	server.game,
				players:  	server.players,
				maxPlayers: server.maxPlayers
			});
		} 
		else {

			if (debug) console.error(`Data for server address '${data.addr}' couldn't fetched.`);
		}
	} catch(error) {
		
		console.error('Error in bamb.js:[QueryServer]');
		console.error(error);
    }
};
//
//--Data-------------------------------------------------------------------------------------------------------------//
//
async function Data() {

	try {

		await wait(resTime);

		const queryServers = await db.findAll({ attributes: { exclude: ['id', 'createdAt', 'updatedAt'] }});

		if (queryServers.length > 0) {

			for (const server of queryServers)  {
				
				console.log(server.dataValues);
			}
		} else {

			if (debug) console.error('No server data stored in the database. Cannot output data to the console.');
		}
	} catch(error) {
		
		console.error('Error in bamb.js:[Data]');
		console.error(error);
	}
};
//
//--End-Of-Code------------------------------------------------------------------------------------------------------//
