/**
 * Mimoto Firebase Toolkit - User Permissions - A tiny toolset to help managing user permissions
 * @author - Sebastian Kersten (sebastian@thesocialcode.com)
 */


// import Mimoto classes
const MimotoFirebaseUtils = require('./MimotoFirebaseUtils');



// ----------------------------------------------------------------------------
// --- Public methods ---------------------------------------------------------
// ----------------------------------------------------------------------------



class MimotoFirebaseUserManagement
{

	_admin = null;
	_functions = null;
	_realtimeDatabase = null;
	_sRegion = null;
	_config = null;

	constructor(admin, functions, sRegion, config)
	{
		console.log('MimotoFirebaseUserManagement');

		// 1. store
		this._admin = admin;
		this._functions = functions;
		this._realtimeDatabase = admin.database();
		this._sRegion = sRegion;
		this._config = config;
	}



	// ----------------------------------------------------------------------------
	// --- Public methods ---------------------------------------------------------
	// ----------------------------------------------------------------------------


	setUserClaims()
	{
		return this._functions.auth.user().onCreate(async (user) => {

			// 1. set special permissions
			await this._setSpecialCustomClaims(user);

			// 2. set custom claims for new user based on items in database
			await this._setCustomClaimsFromData(user);
		});
	}

	updateUserClaims()
	{
		return this._functions.database.ref(this._config.userConfigPath + '/{sTeamMemberID}').onCreate(async (data, context) => {


			customClaims


			// 1. register
			const user = data.val();

			// 2. set custom claims for new user based on items in database
			// let userRecord = await MimotoFirebaseUserManagement.onCreateTeamMember(admin, user.email, user.permissions);

			// 1. load
			let userRecord = await _getRegisteredUser(this._admin, user.email);

			// 2. register or default
			let userClaims = userRecord.customClaims || {};

			// 3. update
			Object.keys(customClaims).forEach(sKey => userClaims[sKey] = customClaims[sKey]);

			// 4. store
			await this._admin.auth().setCustomUserClaims(userRecord.uid, userClaims);

		});
	}

	removeUserClaims()
	{
		return this._functions.database.ref(this._config.userConfigPath + '/{sTeamMemberID}').onDelete(async (data, context) => {



		});
	}





	// onCreateTeamMember(firebaseAdmin, email, customClaims)
	// {
	// 	return new Promise(async (resolve, reject) => {
	//
	//
	//
	// 		// 5. send
	// 		resolve(userRecord);
	// 	});
	// }
	//
	// function onUpdateTeamMember(firebaseAdmin, email, customClaims)
	// {
	// 	return new Promise(async (resolve, reject) => {
	//
	// 		// 1. load
	// 		let userRecord = await _getRegisteredUser(firebaseAdmin, email);
	//
	// 		// 2. register or default
	// 		let userClaims = userRecord.customClaims || {};
	//
	// 		// 3. update
	// 		Object.keys(customClaims).forEach(sKey => userClaims[sKey] = customClaims[sKey]);
	//
	// 		// 4. store
	// 		await firebaseAdmin.auth().setCustomUserClaims(userRecord.uid, userClaims);
	//
	// 		// 5. send
	// 		resolve(userRecord);
	// 	});
	// }

	function onDeleteTeamMember(firebaseAdmin, email, customClaims)
	{
		return new Promise(async (resolve, reject) => {

			// 1. load
			let userRecord = await _getRegisteredUser(firebaseAdmin, email)

			// 2. register or default
			let userClaims = userRecord.customClaims || {};

			// 3. update
			Object.keys(customClaims).forEach(sKey => {

				if (customClaims[sKey] === undefined)
				{
					delete userClaims[sKey];
				}
				else
				{
					userClaims[sKey] = customClaims[sKey];
				}
			});

			// 4. store
			await firebaseAdmin.auth().setCustomUserClaims(userRecord.uid, userClaims);

			// 5. send
			resolve(userRecord);
		});
	}



	// ----------------------------------------------------------------------------
	// --- Private methods ---------------------------------------------------------
	// ----------------------------------------------------------------------------



	/**
	 * Set special permissions for one or more users
	 * WARNING - USER NEEDS TO SIGN OUT AND SIGN IN TO REFRESH TOKEN
	 * @param user
	 * @returns {Promise<unknown>}
	 * @private
	 */
	_setSpecialCustomClaims(user)
	{
		return new Promise(async (resolve, reject) => {

			// 1. register
			let aUsers = this._config.claims;

			// 2. verify and convert to array
			if (MimotoFirebaseUtils.isObject(aUsers)) aUsers = [this._config.claims];

			// 3. validate
			if (!Array.isArray(aUsers)) reject('Special permissions config needs to be either an object or an array of objects');

			// 4. find user
			for (let nIndex = 0; nIndex < aUsers.length; nIndex++)
			{
				// a. register
				let userConfig = aUsers[nIndex];

				// b. validate or skip
				if (!MimotoFirebaseUtils.isObject(userConfig)) return;

				// c. validate and skip
				if (!userConfig.email || userConfig.email.toLowerCase() !== user.email.toLowerCase()) return;

				// d. validate or skip
				if (!MimotoFirebaseUtils.isObject(userConfig.customUserClaims)) return;

				// e. set custom claim for the user
				await this._admin.auth().setCustomUserClaims(user.uid, userConfig.customUserClaims);

				// f. report user has been updated
				resolve(true);
			}

			// 5. report no special permissions for user
			resolve(false);
		});
	}

	_setCustomClaimsFromData(user)
	{
		return new Promise(async (resolve, reject) => {

			// 1. connect
			const ref = this._realtimeDatabase.ref(this._config.userConfigPath);

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
					let userRecord = await this._admin.auth().getUserByEmail(user.email)

					// e. load
					let userClaims = userRecord.customClaims || {};

					// f. merge
					userClaims = MimotoFirebaseUtils.mergeDeep(userClaims, teamMember[this._config.userCustomClaimsPath]);

					// g. store updates claims
					await this._admin.auth().setCustomUserClaims(userRecord.uid, userClaims);

					// h. report ready
					resolve();

				})
				.catch(error => reject(error));
		})
	}

	_getRegisteredUser(firebaseAdmin, sEmail)
	{
		return new Promise(async (resolve, reject) => {

			await firebaseAdmin.auth().getUserByEmail(sEmail)
				.then(async (userRecord) => {

					resolve(userRecord);

				})
				.catch(async error => {

					// Create the user
					const userRecord = await firebaseAdmin.auth().createUser({ email: sEmail }); // displayName: sDisplayName

					resolve(userRecord);
				})
		});
	}
}


module.exports = MimotoFirebaseUserManagement;
