const vars = {
    region: process.env.AWS_REGION,
    debug: "true",
    bucket: process.env.S3_BUCKET,
    httpHandlerApolloServer: {
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        },
        debug: true
    },
    apollo: {
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    },
    mongodb: {
        server: process.env.MONGODB_SERVER,
        name: process.env.MONGODB_NAME
    },
    security: {
        token: {
            expiresIn: 2592000,
            secret: process.env.JWT_SECRET
        }
    }
};

module.exports = ({ cli }) => ({
    resources: {
        gateway: {
            component: "@webiny/serverless-apollo-gateway",
            inputs: {
                region: vars.region,
                memory: 512,
                timeout: 30,
                debug: vars.debug,
                webpackConfig: "./webpack.config.js",
                plugins: [
                    {
                        factory: "@webiny/api-plugin-create-apollo-gateway",
                        options: {
                            server: vars.apollo.server,
                            services: [
                                {
                                    name: "security",
                                    url: "${security.api.graphqlUrl}"
                                },
                                {
                                    name: "files",
                                    url: "${files.api.graphqlUrl}"
                                },
                                {
                                    name: "pageBuilder",
                                    url: "${pageBuilder.api.graphqlUrl}"
                                },
                                {
                                    name: "i18n",
                                    url: "${i18n.api.graphqlUrl}"
                                },
                                {
                                    name: "formBuilder",
                                    url: "${formBuilder.api.graphqlUrl}"
                                }
                            ]
                        }
                    }
                ]
            }
        },
        dbProxy: {
            component: "@webiny/serverless-db-proxy",
            inputs: {
                testConnectionBeforeDeploy: true,
                region: vars.region,
                concurrencyLimit: 15,
                timeout: 30,
                env: {
                    MONGODB_SERVER: vars.mongodb.server,
                    MONGODB_NAME: vars.mongodb.name
                }
            }
        },
        cognito: {
            component: "@webiny/serverless-aws-cognito-user-pool",
            inputs: {
                region: vars.region,
                appClients: [
                    {
                        name: "ReactApp"
                    }
                ]
            }
        },
        security: {
            component: "@webiny/serverless-apollo-service",
            inputs: {
                region: vars.region,
                memory: 512,
                timeout: 30,
                webpackConfig: "./webpack.config.js",
                debug: vars.debug,
                plugins: [
                    {
                        factory: "@webiny/api-plugin-create-apollo-handler",
                        options: vars.apollo
                    },
                    {
                        factory: "@webiny/api-plugin-commodo-db-proxy",
                        options: {
                            functionArn: "${dbProxy.arn}"
                        }
                    },
                    {
                        factory: "@webiny/api-security/plugins",
                        options: vars.security
                    },
                    {
                        factory: "@webiny/api-plugin-security-cognito",
                        options: {
                            region: vars.region,
                            userPoolId: "${cognito.userPool.Id}"
                        }
                    }
                ]
            }
        },
        files: {
            component: "@webiny/serverless-files/dist",
            inputs: {
                region: vars.region,
                bucket: vars.bucket,
                functions: {
                    apolloService: {
                        memory: 512,
                        timeout: 30,
                        debug: vars.debug,
                        uploadMinFileSize: 0,
                        uploadMaxFileSize: 26214400,
                        webpackConfig: "./webpack.config.js",
                        plugins: [
                            {
                                factory: "@webiny/api-plugin-create-apollo-handler",
                                options: vars.apollo
                            },
                            {
                                factory: "@webiny/api-plugin-commodo-db-proxy",
                                options: {
                                    functionArn: "${dbProxy.arn}"
                                }
                            },
                            {
                                factory: "@webiny/api-security/plugins/service",
                                options: vars.security
                            },
                            "@webiny/api-files/plugins",
                            "@webiny/api-plugin-files-resolvers-mongodb"
                        ]
                    },
                    downloadFile: {
                        memory: 512,
                        timeout: 10
                    },
                    imageTransformer: {
                        memory: 1600,
                        timeout: 30
                    }
                }
            }
        },
        i18n: {
            watch: ["./services/i18n/build"],
            build: {
                root: "./services/i18n",
                script: "yarn build",
                define: {
                    HTTP_HANDLER_APOLLO_SERVER_OPTIONS: vars.httpHandlerApolloServer,
                    DB_PROXY_OPTIONS: {
                        functionArn: "${dbProxy.arn}"
                    },
                    SECURITY_OPTIONS: vars.security
                }
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    function: {
                        code: "./services/i18n/build",
                        handler: "handler.handler",
                        memory: 512,
                        env: {
                            DEBUG: vars.debug
                        }
                    }
                }
            }
        },
        pageBuilder: {
            component: "@webiny/serverless-page-builder",
            inputs: {
                region: vars.region,
                files: "${files}",
                memory: 512,
                timeout: 30,
                debug: vars.debug,
                webpackConfig: "./webpack.config.js",
                plugins: [
                    {
                        factory: "@webiny/api-plugin-create-apollo-handler",
                        options: vars.apollo
                    },
                    {
                        factory: "@webiny/api-plugin-commodo-db-proxy",
                        options: {
                            functionArn: "${dbProxy.arn}"
                        }
                    },
                    {
                        factory: "@webiny/api-security/plugins/service",
                        options: vars.security
                    },
                    "@webiny/api-page-builder/plugins",
                    "@webiny/api-page-builder/plugins/useSsrCacheTags",
                    "@webiny/api-plugin-page-builder-resolvers-mongodb",
                    "@webiny/api-google-tag-manager",
                    "@webiny/api-mailchimp",
                    "@webiny/api-cookie-policy"
                ]
            }
        },
        formBuilder: {
            component: "@webiny/serverless-form-builder",
            inputs: {
                region: vars.region,
                files: "${files}",
                i18n: "${i18n}",
                memory: 512,
                timeout: 30,
                debug: vars.debug,
                webpackConfig: "./webpack.config.js",
                plugins: [
                    {
                        factory: "@webiny/api-plugin-create-apollo-handler",
                        options: vars.apollo
                    },
                    {
                        factory: "@webiny/api-plugin-commodo-db-proxy",
                        options: {
                            functionArn: "${dbProxy.arn}"
                        }
                    },
                    {
                        factory: "@webiny/api-security/plugins/service",
                        options: vars.security
                    },
                    "@webiny/api-i18n/plugins/service",
                    "@webiny/api-form-builder/plugins",
                    "@webiny/api-form-builder/plugins/useSsrCacheTags"
                ]
            }
        },
        headlessCms: {
            watch: ["./services/headlessCms/build"],
            build: {
                root: "./services/headlessCms",
                script: "yarn build",
                define: {
                    HTTP_HANDLER_APOLLO_SERVER_OPTIONS: vars.httpHandlerApolloServer,
                    DB_PROXY_OPTIONS: {
                        functionArn: "${dbProxy.arn}"
                    },
                    SECURITY_OPTIONS: vars.security
                }
            },
            deploy: {
                component: "@webiny/serverless-apollo-service",
                inputs: {
                    region: vars.region,
                    description: "I18N GraphQL API",
                    function: {
                        code: "./services/headlessCms/build",
                        handler: "handler.handler",
                        memory: 512,
                        env: {
                            DEBUG: vars.debug
                        }
                    }
                }
            }
        },
        headlessCmsHandler: {
            watch: ["./services/headlessCmsHandler/build"],
            build: {
                root: "./services/headlessCmsHandler",
                script: "yarn build",
                define: {
                    API_I18N: {
                        graphqlUrl: "${i18n.api.graphqlUrl}"
                    },
                    HTTP_HANDLER_APOLLO_SERVER_OPTIONS: vars.httpHandlerApolloServer,
                    DB_PROXY_OPTIONS: {
                        functionArn: "${dbProxy.arn}"
                    },
                    SECURITY_OPTIONS: vars.security
                }
            },
            deploy: {
                component: "@webiny/serverless-function",
                inputs: {
                    description: "Headless CMS GraphQL API (handler)",
                    region: vars.region,
                    code: "./services/headlessCmsHandler/build",
                    handler: "handler.handler",
                    memory: 512,
                    env: {
                        DEBUG: vars.debug
                    }
                }
            }
        },
        api: {
            component: "@webiny/serverless-api-gateway",
            inputs: {
                region: vars.region,
                description: "Main API Gateway",
                endpoints: [
                    {
                        path: "/graphql",
                        method: "ANY",
                        function: "${gateway}"
                    },
                    {
                        path: "/cms/{key+}",
                        method: "ANY",
                        function: "${headlessCmsHandler}"
                    }
                ]
            }
        },
        cdn: {
            component: "@webiny/serverless-aws-cloudfront",
            inputs: {
                origins: [
                    "${files.cdnOrigin}",
                    {
                        url: "${api.url}",
                        pathPatterns: {
                            "/graphql": {
                                ttl: 0,
                                forward: {
                                    headers: ["Accept", "Accept-Language"]
                                },
                                allowedHttpMethods: [
                                    "GET",
                                    "HEAD",
                                    "OPTIONS",
                                    "PUT",
                                    "POST",
                                    "PATCH",
                                    "DELETE"
                                ]
                            },
                            "/cms*": {
                                ttl: 0,
                                forward: {
                                    headers: ["Accept", "Accept-Language"]
                                },
                                allowedHttpMethods: [
                                    "GET",
                                    "HEAD",
                                    "OPTIONS",
                                    "PUT",
                                    "POST",
                                    "PATCH",
                                    "DELETE"
                                ]
                            }
                        }
                    }
                ]
            }
        }
    }
});