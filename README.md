# Strapi generate docs

Generate Swagger (OAI) API specificaiton

```bash
$ strapi generate docs
```

Generates specification file which can be validated with: http://editor.swagger.io/

Viewer: http://swagger.io/swagger-ui/

## Installation: Add custom generator
http://strapi.io/documentation/customization
```json
{
  "generators": {
    "blog": {
      "repository": "git@github.com:mrauter/strapi-generate-docs.git",
      "remote": "origin",
      "branch": "master"
    }
  }
}
```

## Important
Currently only works as expected if auto population is off (config/general.json: blueprints.populate = false)

## Configuration
Default configration will be generated in config/swagger.json

### Customise model configuration
Because a full auto-generation only works for standard CRUD resources you can override and extend the model/route configuration. Just create a swagger.json file in api/{model}/config

```json
{
  "route": {
    "config"
  }
}
```

* route = Key same as in routes.json
* config = swagger specification (will be merged via defaults)

Example for upload module
```json
{
  "POST /upload": {
    "summary": "Upload file",
    "consumes": ["multipart/*"],
    "parameters": [
      {
        "name": "file",
        "in": "formData",
        "description": "File to upload",
        "required": true,
        "type": "file"
      }
    ]
  }
}
```

Example for user module
```json
{
  "POST /auth/local": {
    "summary": "Get auth token",
    "parameters": [
      {
        "name": "identifier",
        "in": "formData",
        "required": true,
        "type": "string"
      },
      {
        "name": "password",
        "in": "formData",
        "required": true,
        "type": "string"
      }
    ],
    "security": []
  },
  "POST /auth/logout": {
    "summary": "Logout",
    "parameters": [],
    "hide": true
  },
  "POST /auth/forgot-password": {
    "summary": "Forgot password",
    "security": [],
    "hide": true
  },
  "POST /auth/change-password": {
    "summary": "Change password",
    "hide": true
  },
  "POST /auth/refresh": {
    "summary": "Refresh auth token",
    "parameters": []
  }
}
...
```

#### Addional parameters
* hide: Hide route in documentation (see above)
* populated: Model will be populated in the response, example:
```json
{
  "attributes": {
    "jwt": {
      "type": "string"
    },
    "user": {
      "model": "user",
      "populated": true
    }
  }
}
```
* Response container
If your respones are wrapped by a container object you can extend config/swagger.json like:
```json
{
  "response": {
    "dataKey" : "data",
    "schema" : {
  	  "type": "object",
  		"properties": {
  		  "status": {
          "type": "integer"
        }
  	  }
    }
  },
  "template": {

  }
}
```

## TODO
* Support for v2
