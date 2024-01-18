/*
* <license header>
*/
/*Original logic:*/
// https://git.corp.adobe.com/CQ/dam-contentfragment/pull/1888/files#diff-6a1ef81fc0da02ed63bfa68d8a57e2ed94dc12b2659d03725d876638892c8b37

const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs, getAemHeaders } = require('../utils');
const ACTION_ACTIVATE = "Activate";

function getReferencedModels(paths, assets) {
    const referencedModels = [];
    const assetsData = assets?.assets || [];

    for (let i = 0; i < assetsData.length; i++) {
        const asset = assetsData[i];
        // if server returns a list containing at least one asset which is not yet published
        // and is not one of the selected nodes to publish
        if ((!asset?.published || asset?.outdated) && paths.indexOf(asset.path) === -1 && (asset?.type === "contentfragmentmodel" || asset?.type === "asset")) {
            referencedModels.push(asset?.path);
        }
    }
    return referencedModels;
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

    try {
        // 'info' is the default level if not set
        logger.info('Calling the publish action')

        // log parameters, only if params.LOG_LEVEL === 'debug'
        logger.debug(stringParameters(params))

        // check for missing request input parameters and headers
        const requiredParams = [/* add required params */]
        const requiredHeaders = ['Authorization']
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger)
        }

        const headers = await getAemHeaders(params);
        const assetsFormData = new FormData();
        params.paths.map(el => assetsFormData.append("path", el));

        const assetsResponse = await fetch(params.aemHost + "/libs/wcm/core/content/reference.json", {
            headers: headers,
            method: "POST",
            body: assetsFormData
        });
        logger.info(` Assets response status text ${assetsResponse.statusText}`);
        if (!assetsResponse.ok) {
            throw new Error('request to get Assets' + params.aemHost + ' failed with status code ' + assetsResponse.status)
        }
        logger.info(`${assetsResponse.status}: successful assets request`);
        /** @todo update logic to publish related assets as well*/
        /** currently response is empty */
        const assets = await assetsResponse.json();
        logger.info(` Assets response  ${JSON.stringify(assets)}`);
        const referencedModels = getReferencedModels(params.paths, assets);
        const publishFormData = new FormData();
        params.paths.concat(referencedModels).map(el => publishFormData.append("path", el));
        publishFormData.append("_charset_", "utf-8");
        publishFormData.append("cmd", ACTION_ACTIVATE);
        //publish
        const publishResponse = await fetch(params.aemHost + "/bin/replicate.json", {
            headers: headers,
            method: "POST",
            body: publishFormData
        });
        logger.info(`Publish response status text ${publishResponse.statusText}`);
        if (!publishResponse.ok) {
            throw new Error('request to get Publish ' + params.aemHost + ' failed with status code ' + publishResponse.status)
        }
        logger.info(`${publishResponse?.status}: successful publish request`);
        return {
            statusCode: 200,
            body: "{}"
        };

    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return errorResponse(500, `Server error: ${error}`, logger)
    }
}

exports.main = main