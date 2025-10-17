//*********************************************************************************************************************
//  Blackwake Game Server Logger
//
//  Author: GRNS | Git: GRNSFI
//
//  Version: v1.0 [STABLE] 
//
//  Last updated: 16.10.2025
//
//  Written using Node.js version v22.19.0
//
//*********************************************************************************************************************
//--Needed-NPM-packages----------------------------------------------------------------------------------------------//
//
//  npm i tail
//  npm i dayjs
//  npm i croner
//  npm i log-timestamp
//
//--Notes------------------------------------------------------------------------------------------------------------//
//
//  Generated logs will be saved in the Blackwake game server 'logs' folder.
//
//--EDITABLE-VARIABLES-----------------------------------------------------------------------------------------------//
//
//--Log rotate time. See https://crontab.guru/ for help. Default: Every day 6AM
//
const rotateTime = '0 6 * * *'; 
//
//--Absolute path to Blackwake game server folder (Example: 'C:\\path\\to\\blackwake\\server').
//
const serverPath = 'C:\\path\\to\\blackwake\\server'; // MUST BE EDITED!
//
//--Set to 'true' if you want to see the log output in the console as well. Default: false
//
const debug = false;
//
//--Add/remove double slashes '//' in front of line below to clear or not clear the console when BW Logger starts.
//
console.clear();
//
//-------------------------------------------------------------------------------------------------------------------//
//--WARNING !! EDITING ANYTHING BELOW THIS LINE MAY BREAK THE CODE !!------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------------//
//--Dependencies-----------------------------------------------------------------------------------------------------//
//
const fs    = require('node:fs');
const path  = require('node:path');
const Cron  = require('croner').Cron;
      Tail  = require('tail').Tail;

const dayjs	= require('dayjs');

require('log-timestamp');
//
//--Paths------------------------------------------------------------------------------------------------------------//
//
const server_log = path.join(serverPath, path.join('logs', 'server.log'));
const output_log = path.join(serverPath, path.join('BlackwakeServer_Data', 'output_log.txt'));
//
//--RegExp-----------------------------------------------------------------------------------------------------------//
//
const logRegex = new RegExp("^\\s*$|^\s*[0-9]|acc_|grapple|Thread ->|Got current node amounts|Object with prefab ID|Loaded Objects now:|çäìíñïäðêìä:|CreateObjectMapping:|MainMenu:|GameModeHandler:|DynamicConquest:|ShipSpawn:|SyncShip:|Failed to find RPC|Failed to connect to master server|Serialized files|IndexOutOfRange|Int32|BotPlayer|System.|WakeNetObject:|Accolade:|winUI|\sat\sGameMode\.|\sat\sUI\+|at\sAccolade\.|\sat\sCaptainsLeaderboard\.|ArgumentOutOfRangeException:|Parameter name:|dropped with parent|belongs to wrong session|wrong connectionId in received user packet|Failed to get arg count|InternalInvoke|WrongConnection|because the the game object|k_EBeginAuthSessionResultOK|got info for|Got id for|Getting large avatar|Getting stats for|Got players stats|temporarily using client score|runtime|Line: 42|\.gen\.cpp|UnityEngine|Grapple index|Exception has been thrown|Could not get lobby info|Timeout Socket|Object reference not set|Validated outfit|Packet has been already received|could not be played| no free slot for incoming connection|Shot denied for|Filename:|If you absolutely need|The effective box size|BoxColliders does not|image effect|RectTransform|could not load|platform assembly|Loading|deprecated|Current environment|object was null|NoResources|Debug|Sending current player|has been disconnected by timeout|Can not play a disabled audio source|song ended for team |sent incorrect|Error: NoResources Socket: |or call this function only for existing animations|FAILED TO FIND PLAYER INFO|at Cannonball|Could not get lobby info for player|Filename:|does not support|The effective box size has been|If you absolutely need to use|Visible only by this ship|NullReferenceException|filename unknown");
//
//--Log-Rotate-------------------------------------------------------------------------------------------------------//
//
const logRotate = new Cron(rotateTime, () => {

    try {

        fs.copyFileSync(server_log,  path.join(serverPath, path.join('logs', `server_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.log`)));
        fs.writeFileSync(server_log, '', { encoding: 'utf8' });

        console.log('Server log rotated.');
        
    } catch (error) {

        console.error('Error in bwlogger.js:[LogRotate]');
        console.error(error);
    }
});
//
//--BWLogger---------------------------------------------------------------------------------------------------------//
//
(() => {

    try {

        console.log('BW Logger started..');

        if (fs.existsSync(output_log)) {

            const logStream = fs.createWriteStream(server_log, { flags: 'a', encoding: 'utf8' });
            
            fs.writeFileSync(output_log, '', { encoding: 'utf8' });
            
            logRotate.trigger();

            const tail = new Tail(output_log, { useWatchFile: true, fsWatchOptions: { interval: 1000 },  nLines: 500 });

            tail.on('line', function (data) {

                if (!logRegex.test(data)) {

                    logStream.write(`[${dayjs().toISOString()}] ${data}\n`);
                    if (debug) console.log(data);
                }
            });
            console.log(`Logging 'output_log.txt' now!`);
        } 
        else {
            
            throw new Error('output_log does not exist');
        }
    } catch (error) {

        console.error('Error in bwlogger.js:[BWLogger]');

		if (error.message === 'output_log does not exist') {
		
			console.error('Output_log.txt does not exist in the path!');
            console.error(`Check Blackwake game server folder variable and that 'output_log.txt' exists in it's 'BlackwakeServer_Data' folder.`);
            console.error(`Given path: '${output_log}'`);
		}
		else {

            console.error(error);
        }
    }
})();
//
//--End-Of-Code------------------------------------------------------------------------------------------------------//
