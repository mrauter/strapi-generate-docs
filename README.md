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
    "docs": {
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
Default configuration will be generated in config/swagger.json

### Customize model configuration
Because a full auto-generation only works for standard CRUD resources you can override and extend the model/route configuration. Just extend routes config with "documentation"

Example for upload module:
```json
{
  "routes": {
    "POST /upload": {
      "controller": "Upload",
      "action": "upload",
      "policies": [
        "addDataCreate",
        "authenticated"
      ],
      "documentation": {
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
  }
}
```

Example for user module:
```json
{
  "routes": {
    "POST /auth/local": {
      "controller": "Auth",
      "action": "callback",
      "documentation" : {
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
        ]
      }
    },
    "POST /auth/logout": {
      "controller": "Auth",
      "action": "logout",
      "documentation" : {
        "hide": true
      }
    },
    "POST /auth/forgot-password": {
      "controller": "Auth",
      "action": "forgotPassword",
      "documentation" : {
        "hide": true
      }
    },
    "POST /auth/change-password": {
      "controller": "Auth",
      "action": "changePassword",
      "documentation" : {
        "hide": true
      }
    },
    ...
}
```

#### Addional parameters
* `hide`: hide route in documentation (see above)
* `populated`: model will be populated in the response, example:
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
* Response container: if your respones are wrapped by a container object you can extend config/swagger.json like:
```json
{
  "container": {
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

* Default respones: you can add general response types to all your calls (example error response)
```json
{
  "responses": {
    "default": {
      "description": "Error",
        "schema": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer"
          },
          "message": {
            "type": "string"
          }
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
