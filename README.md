# Strapi generate docs

Generate Swagger (OAI) API specificaiton

```bash
$ strapi generate docs
```

Generates specification file which can be validated with: http://editor.swagger.io/

Viewer: http://swagger.io/swagger-ui/

## Add custom generator
http://strapi.io/documentation/customization
```
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
