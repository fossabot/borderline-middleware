// Vendor modules
const request = require('request');

// Local modules
const QueryAbstract = require('../queryAbstract.js');

/**
 * @fn QueryTransmart17_1
 * @desc Query Implementation for TranSMART 17.1
 * @param queryModel Plain JS Object, stored in DB
 * @param queryCollection MongoDB collection where the model is stored
 * @param queryGridFS MongoDB gridFS object to read/write query result
 * @constructor
 */
function QueryTransmart17_1(queryModel, queryCollection, queryGridFS) {
    QueryAbstract.call(this, queryModel, queryCollection, queryGridFS);
}
QueryTransmart17_1.prototype = Object.create(QueryAbstract.prototype); //Inherit Js style
QueryTransmart17_1.prototype.constructor = QueryTransmart17_1;

/**
 * @fn _isAuth
 * @desc Returns true if this query has a non-expired token
 * @private
 */
QueryTransmart17_1.prototype._isAuth = function() {
    //Needs first auth if Oauth token details are missing
    if (this.model.credentials.hasOwnProperty('access_token') === false ||
        this.model.credentials.hasOwnProperty('expires_in') === false ||
        this.model.credentials.hasOwnProperty('generated') === false)
        return false;

    var now = new Date();
    //Compute expiration date for this token
    var expires = new Date(this.model.credentials.generated);
    expires.setTime(expires.getTime() +  this.model.credentials.expires_in * 1000);
    //Compares now and expiration date
    return (now < expires);
};

/**
 * @fn _doAuth
 * @desc Gets a new token from TS endpoint and store it in DB
 * @return {Promise}
 * @private
 */
QueryTransmart17_1.prototype._doAuth = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
        //Get new credentials from data source
        request.post({
            method: 'POST',
            json: true,
            baseUrl: _this.model.endpoint.sourceHost + ':' + _this.model.endpoint.sourcePort,
            uri: '/oauth/token?grant_type=password&client_id=glowingbear-js&client_secret=' +
            '&username=' + _this.model.credentials.username +
            '&password=' + _this.model.credentials.password
        }, function (error, response, body) {
            if (!response) { //Reject on errors
                reject(error); return;
            }
            //Update queryModel
            var newCredentials = Object.assign({}, _this.model.credentials, body, {generated: new Date()});
            var newModel = Object.assign({}, _this.model, {credentials: newCredentials});
            _this.model = newModel;
            _this.pushModel().then(function() {
                resolve(true);
            }, function (error) {
                reject(error);
            });
        });
    });
};

/**
 * @fn _ensureAuth
 * @desc Makes sure this query has a valid OAuth Bearer token
 * @private
 */
QueryTransmart17_1.prototype._ensureAuth = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
        if (_this._isAuth() == false) {
            _this._doAuth().then(function() {
                resolve(true);
            }, function (error) {
                reject(error);
            });
        }
        else {
            resolve(true);
        }
    });
};

/**
 * @fn execute
 * @desc Perform query on Transmart endpoint, stores and translate the outputs
 * @return {Promise} Execution summary object on success
 */
QueryTransmart17_1.prototype.execute = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
        var start_time = new Date();
        var fail_callback = function(error) {
            var fail_time = new Date();
            var delta_time = fail_time - start_time;
            reject({ status: 'fail', time: delta_time.toString() + ' ms', error: error.toString() });
        };
        _this._ensureAuth().then(function() {
            request.get({
                baseUrl: _this.model.endpoint.sourceHost + ':' + _this.model.endpoint.sourcePort,
                uri: _this.model.input.local.uri + JSON.stringify(_this.model.input.local.params),
                headers: {
                    Authorization: 'Bearer ' + _this.model.credentials.access_token
                }
            }, function (error, response, body) {
                if (!response) {
                    reject(error); return;
                }
                _this.setOutputLocal(body).then(function(std_data) {
                    var success_time = new Date();
                    var delta_time = success_time - start_time;
                    resolve({status: 'success!', time: delta_time.toString() + ' ms', data: std_data});
                }, fail_callback);
            });
        }, fail_callback);
    });
};

/**
 * @fn input_local2standard
 * @todo Real implementation
 * @param data A TranSMART 17.1 query object to transform into standard query
 * @return Transformed to standard JS object
 */
QueryTransmart17_1.prototype.input_local2standard = function(data) {
    //Do nothing ATM
    return data;
};

/**
 * @fn input_standard2local
 * @todo Real implementation
 * @param data A Standard query input to transform to TranSMART 17.1 query object
 * @return Transformed to TS 17.1 object
 */
QueryTransmart17_1.prototype.input_standard2local = function(data) {
    //Do nothing.. Todo
    return data;
};

/**
 * @fn output_local2standard
 * @todo Real implementation
 * @param data A TranSMART 17.1 query object to transform
 * @return Output data in standard format
 */
QueryTransmart17_1.prototype.output_local2standard = function(data) {
    //Todo
    return data;
};

/**
 * @fn output_standard2local
 * @todo Real Implementation
 * @param data A Standard output object to transform
 * @return Object transformed to local format
 */
QueryTransmart17_1.prototype.output_standard2local = function(data) {
    //todo
    return data;
};


module.exports = QueryTransmart17_1;