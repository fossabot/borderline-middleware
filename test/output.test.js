const request = require('request');
const TestServer = require('./testserver.js');
let config = require('../config/borderline.config.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

let test_server = new TestServer();
let g_query_id = '';
const ts171_query = {
    endpoint: { sourceType: "TS171", sourceName: "Transmart instance", sourceHost: "http://transmart.thehyve.net",  sourcePort: 80,  public: false },
    credentials: { username: "demo-user", password: "demo-user" },
    input: {
        local: {
            uri: "/v2/observations?constraint=",
            params: {
                type: "combination", operator: "and",
                args: [
                    { type: "concept", path: "\\Public Studies\\CATEGORICAL_VALUES\\Demography\\Gender\\Male\\" },
                    { type: "concept", path: "\\Public Studies\\CATEGORICAL_VALUES\\Demography\\Gender\\Female\\" }
                ],
            },
            type: 'clinical'
        },
        std: {}
    },
    status: { status: "unknown", start: null, end: null, info: "" },
    output: {
        local: { dataSize: 0, dataId: null},
        std: { dataSize: 0, dataId: null }
    }
};

beforeAll(function() {
    return new Promise(function (resolve, reject) {
        test_server.start(config).then(function() {
            resolve(true);
        }, function (error) {
            reject(error.toString());
        });
    });
});

test('Retrieve output for unknown query id', function(done) {
    expect.assertions(3);
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/query/hibou_qui_pue/output',
        json: true,
        body: { query: g_query_id }
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(404);
        expect(body).toBeDefined();
        done();
    });
});

test('Create a VALID test TS171 query, save the id as ref', function(done) {
    expect.assertions(6);
    request(
        {
            method: 'POST',
            baseUrl: 'http://127.0.0.1:' + config.port,
            uri: '/query/new/',
            json: true,
            body: ts171_query
        }, function (error, response, body) {
            if (error) {
                done.fail(error.toString());
            }
            expect(response).toBeDefined();
            expect(response.statusCode).toEqual(200);
            expect(body).toBeDefined();
            expect(body.status).toBeDefined();
            expect(body.status.status).toEqual('unknown');
            expect(body._id).toBeDefined();
            g_query_id = body._id;
            done();
        }
    );
});

test('Execute current query_id, check its started', function(done) {
    expect.assertions(4);
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/execute',
        json: true,
        body: { query: g_query_id }
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response.statusCode).toEqual(200);
        expect(body).toBeDefined();
        expect(body.status).toBeDefined();
        expect(body.status).toEqual('running');
        done();
    });
});


test('Wait 10 secs, Check execution status current query is done', function(done) {
    expect.assertions(4);
    setTimeout(function() {
        request({
            method: 'GET',
            baseUrl: 'http://127.0.0.1:' + config.port,
            uri: '/execute/' + g_query_id,
            json: true
        }, function (error, response, body) {
            if (error) {
                done.fail(error.toString());
                return;
            }
            expect(response.statusCode).toEqual(200);
            expect(body).toBeDefined();
            expect(body.status).toBeDefined();
            expect(body.status).toEqual('done');
            done();
        });
    }, 10000);
});

test('Retrieve output for the current query', function(done) {
    expect.assertions(4);
    request({
        method: 'GET',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/query/' + g_query_id + '/output',
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(200);
        expect(body).toBeDefined();
        let body_json = JSON.parse(body);
        expect(body_json.dimensionDeclarations).toBeDefined();
        done();
    });
});

test('Update output for the current query', function(done) {
    expect.assertions(4);
    request({
        method: 'PUT',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/query/' + g_query_id + '/output',
        body : { test:  'testme' },
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(200);
        expect(body).toBeDefined();
        let body_json = JSON.parse(body);
        expect(body_json.test).toEqual('testme');
        done();
    });
});

test('Delete output for the current query', function(done) {
    expect.assertions(2);
    request({
        method: 'DELETE',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/query/' + g_query_id + '/output',
        json: true
    }, function(error, response, __unused__body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(200);
        done();
    });
});

test('Update output for the current query, after a delete operation', function(done) {
    expect.assertions(4);
    request({
        method: 'PUT',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/query/' + g_query_id + '/output',
        json: true,
        body : {
            test: true
        }
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
            return;
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(200);
        expect(body).toBeDefined();
        let body_json = JSON.parse(body);
        expect(body_json.test).toBeTruthy();
        done();
    });
});


test('Delete current TS171 {query_id}', function(done) {
    expect.assertions(2);
    request(
        {
            method: 'DELETE',
            baseUrl: 'http://127.0.0.1:' + config.port,
            uri: '/query/' + g_query_id,
            json: true
        }, function (error, response, __unused__body) {
            if (error) {
                done.fail(error.toString());
            }
            expect(response).toBeDefined();
            expect(response.statusCode).toEqual(200);
            done();
        }
    );
});

afterAll(function() {
    g_query_id = null;
    return test_server.stop();
});
