/**
 * Mimoto Firebase Toolkit - User Permissions - A tiny toolset to help managing user permissions
 * @author - Sebastian Kersten (sebastian@thesocialcode.com)
 */


// import Mimoto classes
const MimotoFirebaseUtils = require('./MimotoFirebaseUtils');



// ----------------------------------------------------------------------------
// --- Public methods ---------------------------------------------------------
// ----------------------------------------------------------------------------


/**
 * Set special permissions for one or more users
 * WARNING - USER NEEDS TO SIGN OUT AND SIGN IN TO REFRESH TOKEN
 * @param firebaseAdmin - Reference to a configured Firebase Admin SDK
 * @param user
 * @param config
 * @returns {Promise<unknown>}
 */
function setSpecialCustomClaims(firebaseAdmin, user, config = {})
{
	return new Promise(async (resolve, reject) => {

		// 1. register
		let aUsers = config;

		// 2. verify and convert to array
		if (MimotoFirebaseUtils.isObject(aUsers)) aUsers = [config];

		// 3. validate
		if (!Array.isArray(aUsers)) reject('Special permissions config needs to be either an object or an array of objects');

		// 4. find user
		aUsers.forEach(async userConfig => {

			// a. validate or skip
			if (!MimotoFirebaseUtils.isObject(userConfig)) return;

			// b. validate and skip
			if (!userConfig.email || userConfig.email.toLowerCase() !== user.email.toLowerCase()) return;

			// c. validate or skip
			if (!MimotoFirebaseUtils.isObject(userConfig.customUserClaims)) return;

			// d. set custom claim for the user
			await firebaseAdmin.auth().setCustomUserClaims(user.uid, customUserClaims);

			// e. report user has been updated
			resolve(true);
		});

		// 5. report no special permissions for user
		resolve(false);
	});
}

function setCustomClaimsForNewUser(firebaseAdmin, user, config = {})
{
	return new Promise(async (resolve, reject) => {

		// 1. connect
		const ref = firebaseAdmin.database().ref(config.userConfigPath);

		// 2. load
		ref.orderByChild('email').equalTo(user.email).once('value')
			.then(async snapshot => {

				// a. exit is no user registered
				if (!snapshot.exists()) return;

				// b. register
				const teamMembers = snapshot.val();

				// c. isolate
				let teamMember = teamMembers[Object.keys(teamMembers)[0]];

				// d. find
				let userRecord = await firebaseAdmin.auth().getUserByEmail(user.email)

				// e. load
				let userClaims = userRecord.customClaims || {};

				// f. merge
				userClaims = MimotoFirebaseUtils.mergeDeep(userClaims, teamMember[config.userCustomClaimsPath]);

				// g. store updates claims
				await firebaseAdmin.auth().setCustomUserClaims(userRecord.uid, userClaims);

				// h. report ready
				resolve();

			})
			.catch(error => reject(error));
	})
}

function updateCustomClaimsForExistingUser(firebaseAdmin, user, config = {})
{
	return new Promise(async (resolve, reject) => {


	});
}


function onCreateTeamMember()
{
	return new Promise(async (resolve, reject) => {

	});
}

function onUpdateTeamMember()
{
	return new Promise(async (resolve, reject) => {

	});
}

function onDeleteTeamMember()
{
	return new Promise(async (resolve, reject) => {

	});
}



// ----------------------------------------------------------------------------
// --- Class definition -------------------------------------------------------
// ----------------------------------------------------------------------------


module.exports = {
	setSpecialCustomClaims,
	setCustomClaimsForNewUser,
	updateCustomClaimsForExistingUser,
	onCreateTeamMember,
	onUpdateTeamMember,
	onDeleteTeamMember
};
