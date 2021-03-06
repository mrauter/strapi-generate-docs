'use strict';

/**
 * Module dependencies
 */

const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');

/**
 * This `before` function is run before generating targets.
 * Validate, configure defaults, get extra dependencies, etc.
 *
 * @param {Object} scope
 * @param {Function} cb
 */

module.exports = function (scope, cb) {

	const rootPath = path.resolve(scope.rootPath);
	const config = fs.readJsonSync(rootPath+'/config/general.json');

	const specFile = rootPath+'/config/swagger.json';
	if (!fs.existsSync(specFile)){
		fs.copySync(path.resolve(__dirname, '..', 'files', 'config/swagger.json'), specFile);
	}
	const docsDir = rootPath+'/public/docs';
	if (!fs.existsSync(docsDir+'/index.html')){
		fs.copySync(path.resolve(__dirname, '..', 'files/public/docs'), docsDir);
	}

	const swaggerConfig = fs.readJsonSync(specFile);

	let specification = swaggerConfig.template;
	specification.paths = {};

	if(specification.definitions == undefined) {
		specification.definitions = {};
	}

	let usedModels = ['RequestError'];

	findFiles(rootPath+'/api', 'config', 'routes.json', function(path, name, stat) {

		const json = fs.readJsonSync(path);

		_.forIn(json.routes, function(value, key) {

		  
		  	const route = key.split(' ', 2);
		 	const method = route[0].toLowerCase();
		 	let path = route[1];

		 	let queryParams = [];
	 		path = path.replace(/:([a-z0-9-_]*)/ig, function(i,match) {
				queryParams.push(match);
				return "{"+match+"}";
			});

			if(specification.paths[path] == undefined) {
				specification.paths[path] = {};
			}

			const name = value.controller.toLowerCase();
			const multi = (path.indexOf('{id}') == -1);

			let data = { "$ref": "#/definitions/"+value.controller };
			let parameters = [];

			queryParams.forEach(function(param) {
				parameters.push({
					in: 'path',
					name: param,
					description: param,
					required: true,
					type: 'string'
				});
			});

			if(method == 'get' && multi) {
				data = {
					type: 'array',
					items: { "$ref": "#/definitions/"+value.controller }
				};
				parameters.push({
                    name: 'where',
                    in: 'query',
                    description: 'Waterline filter param',
                    required: false,
                    type: 'string'
                });
                parameters.push({
                	name: 'sort',
                    in: 'query',
                    description: 'Waterline sort param',
                    required: false,
                    type: 'string'
                });

                if(!_.includes(usedModels, value.controller)) {
                	usedModels.push(value.controller);
            	}
			} else if(method == 'post' || method == 'put') {
				parameters.push({
                    name: 'body',
                    in: 'body',
                    description: _.capitalize(name)+' object in JSON',
                    required: true,
                    schema: data
                });

                if(!_.includes(usedModels, value.controller)) {
                	usedModels.push(value.controller);
            	}
			}

			let summary = '';
			switch(method) {
				case 'get': summary = multi ? 'Get all '+name+'s with filter and sorting' : 'Get '+name+' by id'; break;
				case 'post': summary = 'Create new '+name; break;
				case 'delete': summary = 'Delete '+name; break;
				case 'put': summary = 'Update '+name; break;
			}

			let responseSchema = data;
			if(swaggerConfig.response != undefined) {
				let dataProperty = {};
				dataProperty[swaggerConfig.response.dataKey] = data;
				responseSchema = _.defaultsDeep({
					properties: dataProperty
				}, swaggerConfig.response.schema);
			}

			let responses = _.defaults({
				'200': {
					description: "Repsonse",
					schema: responseSchema
				}				
			}, swaggerConfig.responses);

			let spec = {
				summary: summary,
				tags: [_.capitalize(name)],
				parameters: parameters,
				responses: responses,
				security: swaggerConfig.security
			};

			// merge documentation config
			if(value.documentation != undefined) {
				if(value.documentation.hide != true) {
					if(value.documentation.responses != undefined) {
						spec.responses = _.defaults(value.documentation.responses, spec.responses);
					}
					spec = _.defaults(value.documentation, spec);
					specification.paths[path][method] = spec;
				}
			} else {
				specification.paths[path][method] = spec;
			}

			
		});
	});

	let definitions = [];

	findFiles(rootPath+'/api', 'models', 'settings.json', function(path, name, stat) {
		const json = fs.readJsonSync(path);
		const model = name.replace('.settings.json','');
		const availableTypes = ['integer','number','string','boolean'];

		let properties = {}, property;

		if(json.schema) {
			properties['id'] = {
				type: 'integer'
			};
		}

		_.forIn(json.attributes, function(value, key) {

			if(value.model != undefined) {
				const model = _.capitalize(value.model);
				if(config.blueprints.populate == true || value.populated == true) {
					property = { "$ref": "#/definitions/"+model };
				} else if(value.type == 'array') {
					property = { type: 'array', items: { "$ref": "#/definitions/"+model } };
                	if(!_.includes(usedModels, model)) {
	                	usedModels.push(model);
	            	}
				} else {
					property = { type: 'integer' };
				}
			} else if(config.blueprints.populate == true && value.collection != undefined) {
				const model = _.capitalize(value.collection);
				property = { type: 'array', items: { "$ref": "#/definitions/"+model } };
                if(!_.includes(usedModels, model)) {
                	usedModels.push(model);
            	}
			} else {
				if(_.includes(availableTypes, value.type)) {
					property = { type: value.type };
				} else {
					property = { type: 'string' };
				}
			}

			properties[key] = property;

		});

		if(json.autoCreatedAt) {
			properties['createdAt'] = {
				type: 'string'
			};
		}

		if(json.autoUpdatedAt) {
			properties['updatedAt'] = {
				type: 'string'
			};
		}

		if(definitions[model] == undefined) {
			definitions[model] = {
				type: 'object',
				properties: properties
			};
		}

	});

	_.forIn(definitions, function(value, key) {
		if(_.includes(usedModels, key)) {
			specification.definitions[key] = value;
		}
	});

	const dir = rootPath+'/public/docs';
	const file = 'swagger-generated.json';
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
	fs.writeJsonSync(dir+'/'+file, specification);

	_.defaults(scope, {
	    humanizeId: file,
	    humanizedPath: '`'+dir+'`'
	  });

	// Trigger callback with no error to proceed.
 	return cb.success();
};


function findFiles(currentDirPath, dirPattern, pattern, callback) {
    const excludes = ['admin'];

    fs.readdirSync(currentDirPath).forEach(function (name) {
    	if(!_.includes(excludes, name)) {
	        let filePath = path.join(currentDirPath, name);
	        let stat = fs.statSync(filePath);
	        if (path.basename(currentDirPath) == dirPattern && stat.isFile() && name.indexOf(pattern) != -1) {
	            callback(filePath, name, stat);
	        } else if (stat.isDirectory()) {
	            findFiles(filePath, dirPattern, pattern, callback);
	        }
    	}
    });
}