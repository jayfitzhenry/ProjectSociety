// Project Society: Azure resources
// Static Web App (Free) with managed Functions API + Cosmos DB for NoSQL (free tier).
// Deploy with:  az deployment group create -g rg-projectsociety -f infra/main.bicep

targetScope = 'resourceGroup'

@description('Prefix used for resource names.')
param appName string = 'projectsociety'

@description('Static Web Apps only runs in westus2, centralus, eastus2, westeurope, eastasia. West Europe is closest to the UK.')
param location string = 'westeurope'

@description('Cosmos DB free tier: one account per subscription. Set false if you already have a free-tier account.')
param cosmosFreeTier bool = true

@description('Shared throughput for the whole database. Keep at 1000 or below to stay inside the free tier.')
@minValue(400)
@maxValue(1000)
param databaseThroughput int = 1000

var suffix = uniqueString(resourceGroup().id)
var databaseName = 'society'

// Partition keys: users by their own id, characters and notes by owner, everything in a campaign
// (the campaign itself, memberships, crew state, stories, snippets) by campaignId.
var containers = [
  { name: 'users', pk: '/id' }
  { name: 'characters', pk: '/ownerId' }
  { name: 'notes', pk: '/ownerId' }
  { name: 'campaigns', pk: '/campaignId' }
]

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: '${appName}-cosmos-${suffix}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: cosmosFreeTier
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    minimalTlsVersion: 'Tls12'
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmos
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: {
      throughput: databaseThroughput
    }
  }
}

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = [
  for c in containers: {
    parent: database
    name: c.name
    properties: {
      resource: {
        id: c.name
        partitionKey: {
          paths: [c.pk]
          kind: 'Hash'
        }
      }
    }
  }
]

resource web 'Microsoft.Web/staticSites@2024-04-01' = {
  name: '${appName}-web'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // No repositoryUrl: deployment is pushed from GitHub Actions with the deployment token.
  }
}

// App settings for the managed Functions API. Managed functions can't use managed identity,
// so the Cosmos key goes in here (never in the repo).
resource webSettings 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: web
  name: 'appsettings'
  properties: {
    COSMOS_ENDPOINT: cosmos.properties.documentEndpoint
    COSMOS_KEY: cosmos.listKeys().primaryMasterKey
    COSMOS_DATABASE: databaseName
  }
}

output staticWebAppName string = web.name
output siteUrl string = 'https://${web.properties.defaultHostname}'
output cosmosAccountName string = cosmos.name
