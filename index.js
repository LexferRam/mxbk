import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'

import { Configuration, MxPlatformApi } from 'mx-platform-node'

dotenv.config({ path: './.env' })
var port = process.env.PORT || 8000

var app = express()
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.listen(port, function () {
  console.log(`mx-quickconnect node backend is listening on port ${port}`)
})

const configuration = new Configuration({
  // Configure with your Client ID/API Key from https://dashboard.mx.com
  username: process.env.CLIENT_ID,
  password: process.env.API_KEY,

  // Configure environment. https://int-api.mx.com for development, https://api.mx.com for production
  basePath: 'https://int-api.mx.com',

  baseOptions: {
    headers: {
      Accept: 'application/vnd.mx.api.v1+json'
      // TODO: here we can change the widget language
      // 'Accept-Language': 'es' //en-US
    }
  }
})

const client = new MxPlatformApi(configuration)

app.get('/api/users', async function (_request, response) {
  try {
    const listUsersResponse = await client.listUsers()
    client.deleteManagedAccount()
    response.json(listUsersResponse.data)
  } catch (e) {
    logAndReturnApiError('listUserAccounts', e, response)
  }
})

app.delete('/api/user/:userGuid', async function (request, response) {
  try {
    await client.deleteUser(request.params.userGuid)
    response.json({ user_guid: request.params.userGuid })
  } catch (e) {
    logAndReturnApiError('listUserAccounts', e, response)
  }
})

app.post('/api/get_mxconnect_widget_url', async function (request, response) {
  try {
    let userGuid = request.body.user_guid
    if (userGuid == null) {
      const createUserRequestBody = {
        user: {
          id: request.body.user_id ? request.body.user_id : null
        }
      }
      const createUserResponse = await client.createUser(createUserRequestBody)
      userGuid = createUserResponse.data.user.guid
    }

    const widgetRequestBody = {
      widget_url: {
        include_transactions: true,
        is_mobile_webview: false,
        mode: 'verification',
        ui_message_version: 4,
        widget_type: 'connect_widget'
      }
    }

    const widgetResponse = await client.requestWidgetURL(userGuid, widgetRequestBody)
    response.json(widgetResponse.data)
  } catch (e) {
    logAndReturnApiError('requestWidgetURL', e, response)
  }
})
// create user LEXFER
app.get('/api/createUser', async function (request, response) {
  try {
    const createUserRequestBody = {
      user: {
        // email: 'email@provider.com',
        id: null
        // is_disabled: false,
        // metadata: '{\\"first_name\\": \\"Lexfer\\", \\"last_name\\": \\"Ramirez\\"}'
      }
    }
    const createUserResponse = await client.createUser(createUserRequestBody)
    response.json(createUserResponse.data)
  } catch (e) {
    logAndReturnApiError('requestWidgetURL', e, response)
  }
})

// get widget_url LEXFER
app.post('/api/get_widget_url/:userGuid/:theme', async function (request, response) {
  try {
    let userGuid = request.params.userGuid
    let userTheme = request.params.theme

    const widgetRequestBody = {
      widget_url: {
        include_transactions: true,
        is_mobile_webview: false,
        mode: 'verification',
        ui_message_version: 4,
        widget_type: 'connect_widget',
        color_scheme: userTheme
      }
    }

    const widgetResponse = await client.requestWidgetURL(userGuid, widgetRequestBody)
    response.json(widgetResponse.data)
  } catch (e) {
    logAndReturnApiError('requestWidgetURL', e, response)
  }
})

// /users/:userGuid/members/:memberGuid/check_balance
app.get('/users/:userGuid', async function (request, response) {
  try {
    const listUserAccountsResponse = await client.listUserAccounts(request.params.userGuid)
    response.json(listUserAccountsResponse.data)
  } catch (e) {
    logAndReturnApiError('listUserAccounts', e, response)
  }
})

app.get('/users/:userGuid/members/:memberGuid/check_balance', async function (request, response) {
  try {
    const listUserAccountsResponse = await client.listUserAccounts(request.params.userGuid)
    response.json(listUserAccountsResponse.data)
  } catch (e) {
    logAndReturnApiError('listUserAccounts', e, response)
  }
})

app.post('/users/:userGuid/members/:memberGuid/check_balance', async function (request, response) {
  try {
    const balancesResponse = await client.checkBalances(
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(balancesResponse.data)
  } catch (e) {
    logAndReturnApiError('checkBalances', e, response)
  }
})

app.get('/users/:userGuid/members/:memberGuid/status', async function (request, response) {
  try {
    const statusResponse = await client.readMemberStatus(
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(statusResponse.data)
  } catch (e) {
    logAndReturnApiError('readMemberStatus', e, response)
  }
})

app.get('/users/:userGuid/members/:memberGuid/verify', async function (request, response) {
  try {
    const listAccountNumbersResponse = await client.listAccountNumbersByMember(
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(listAccountNumbersResponse.data)
  } catch (e) {
    logAndReturnApiError('listAccountNumbersByMember', e, response)
  }
})

app.get('/users/:userGuid/members/:memberGuid/identify', async function (request, response) {
  try {
    const listAccountOwnersResponse = await client.listAccountOwnersByMember(
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(listAccountOwnersResponse.data)
  } catch (e) {
    logAndReturnApiError('listAccountOwnersResponse', e, response)
  }
})

app.post('/users/:userGuid/members/:memberGuid/identify', async function (request, response) {
  try {
    const identifyMemberResponse = await client.identifyMember(
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(identifyMemberResponse.data)
  } catch (e) {
    logAndReturnApiError('identifyMember', e, response)
  }
})

// TODO: TRANSACCIONES POR USER/CUENTA
app.post(
  '/users/:userGuid/account/:accountGuid/transactions/:page',
  async function (request, response) {
    try {
      const listTransactionsResponse = await client.listTransactionsByAccount(
        request.params.accountGuid,
        request.params.userGuid,
        request.params.fromDate,
        request.params.page
      )
      response.json(listTransactionsResponse.data)
    } catch (e) {
      logAndReturnApiError('listTransactionsByAccount', e, response)
    }
  }
)

// TODO: ELIMINAR UNA FI DE UN USUARIO
app.delete('/users/:userGuid/member/:memberGuid/deletemember', async function (request, response) {
  try {
    const resp = await client.deleteMember(
      // request.params.accountGuid,
      request.params.memberGuid,
      request.params.userGuid
    )
    response.json(resp)
  } catch (e) {
    logAndReturnApiError('deleteMember', e, response)
  }
})

// TODO: ELIMINAR UNA CUENTA DE UN FI QUE PERTENECE A UN USUARIO
// https://docs.mx.com/api   ===> Delete a managed account
// Error when calling MxPlatformApi->deleteManagedAccount: HTTP 403 Forbidden
// {
//   error: {
//     message: 'Client does not have access to managed member features',
//     status: 'forbidden',
//     type: 'missing_platform_api_permission'
//   }
// }
app.delete(
  '/users/:userGuid/member/:memberGuid/account/:accountGuid/deleteManagedAccount',
  async function (request, response) {
    try {
      const resp = await client.deleteManagedAccount(
        request.params.accountGuid,
        request.params.memberGuid,
        request.params.userGuid
      )
      response.json(resp)
    } catch (e) {
      logAndReturnApiError('deleteManagedAccount', e, response)
    }
  }
)

function logAndReturnApiError(method, e, response) {
  if (!e.response) {
    console.log('Error when calling MxPlatformApi->' + method + ': ' + e)
    response.status('500').send({ errorMessage: e })
    return
  }
  console.log(
    'Error when calling MxPlatformApi->' +
      method +
      ': HTTP ' +
      e.response.status +
      ' ' +
      e.response.statusText
  )
  console.log(e.response.data)
  response.status(e.response.status).send({ errorMessage: e.response.data })
}
