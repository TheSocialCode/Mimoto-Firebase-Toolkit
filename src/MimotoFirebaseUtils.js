/**
 * Mimoto Firebase Toolkit - Utils - A collection of common data manipulation functions
 * @author - Sebastian Kersten (sebastian@thesocialcode.com)
 */


// import NodeJS classes
const fs = require('fs');


function removeUndefinedProperties(obj)
{
	for (let prop in obj)
	{
		if (obj.hasOwnProperty(prop) && obj[prop] === undefined) delete obj[prop];

		if (typeof obj[prop] === 'object') removeUndefinedProperties(obj[prop]);
	}

	return obj;
}

function addLeadingZeros(num, size) {
	num = num.toString();
	while (num.length < size) num = "0" + num;
	return num;
}


/**
 * Load template and inject data
 * @param sPathToTemplate
 * @param data
 * @param sOpeningTag
 * @param sClosingTag
 * @returns {Promise<unknown>}
 */
async function useTemplate(sPathToTemplate, data, sOpeningTag = '{{', sClosingTag = '}}')
{
	return new Promise(async (resolve, reject) => {
		// 1.  convert data to deep vars
		let aDeepValues = collectDeepValues(data);

		// 2. load template
		let sTemplate = await readFile(sPathToTemplate);

		// 3. inject vars into templates and send
		resolve(replaceVars(sTemplate, aDeepValues, sOpeningTag, sClosingTag));
	});
}

/**
 * Read a file and return its content
 * @param sPath
 * @returns {Promise<unknown>}
 * @private
 */
function readFile(sPath)
{
	return new Promise((resolve, reject) => {

		// 1. load
		fs.readFile(sPath, 'utf8', (err, data) => {

			// a. validate or report error
			if (err) { reject(err); return; }

			// b. send
			resolve(data);

		});
	});
}

/**
 * Convert data to deep vars
 * @param data
 * @param aVars
 * @param sPrefix
 * @returns {{}}
 * @private
 */
function collectDeepValues(data, aVars = {}, sPrefix = '')
{
	// 1. validate or return empty but uasable result
	if (typeof data !== 'object') return {};

	// 2. extract
	for (let sKey in data)
	{
		if (typeof data[sKey] === 'object')
		{
			collectDeepValues(data[sKey],aVars, (sPrefix) ? sPrefix + '.' + sKey : sKey);
		}
		else
		{
			aVars[(sPrefix) ? sPrefix + '.' + sKey : sKey] = data[sKey];
		}
	}

	return aVars;
}

/**
 * Replace vars in text
 * @param sText
 * @param aDeepValues
 * @param sOpeningTag
 * @param sClosingTag
 * @returns {*}
 * @private
 */
function replaceVars(sText, aDeepValues, sOpeningTag = '{{', sClosingTag = '}}')
{
	// 1. init
	let vars = {}

	// 2. compose
	let regExp = new RegExp(sOpeningTag + '(.*?)' + sClosingTag, 'gi');

	// 3. load vars
	let aMatches = sText.match(regExp);

	// 4. return original text if no vars found
	if (!aMatches) return sText;

	// 5. convert
	aMatches.forEach((sIdentifier, nIndex) => vars[sIdentifier] = sIdentifier.substring(2, sIdentifier.length - 2).trim());

	// 6. replace
	for (let sIdentifier in vars) sText = sText.replaceAll(sIdentifier, aDeepValues[vars[sIdentifier]]);

	// 7. send
	return sText;
}

/**
 * Clone object
 * @param objectToClone
 * @returns {any}
 */
function clone(objectToClone)
{
	// 1. verify or default
	if (!isObject(objectToClone) && !Array.isArray(objectToClone)) return objectToClone;

	// 2. clone array and send
	if (Array.isArray(objectToClone))
	{
		// a. init
		let aClonedArray = [];

		// b. copy and clone
		objectToClone.forEach(value => aClonedArray.push(clone(value)));

		// c. send
		return aClonedArray;
	}

	// 3. duplicate and send
	return JSON.parse(JSON.stringify(objectToClone));
}

isObject = function(variableToVerify)
{
	// 1. verify and report
	return (variableToVerify && typeof variableToVerify === 'object' && !Array.isArray(variableToVerify));
}


module.exports = {
	removeUndefinedProperties,
	addLeadingZeros,
	useTemplate,
	readFile,
	collectDeepValues,
	replaceVars,
	clone,
	isObject
};