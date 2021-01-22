import * as path from 'path'
import { runBrowserWith } from '../support/runBrowserWith'
import { captureConsole } from '../support/captureConsole'

function createRuntime() {
  return runBrowserWith(
    path.resolve(__dirname, 'query-params-warning.mocks.ts'),
  )
}

test('warns when a request handler URL contains query parameters', async () => {
  const runtime = await createRuntime()
  const { messages } = captureConsole(runtime.page)

  await runtime.reload()

  expect(messages.warning).toEqual([
    `\
[MSW] Found a redundant usage of query parameters in the request handler URL for "GET /user?name=admin". Please match against a path instead, and access query parameters in the response resolver function:

rest.get("/user", (req, res, ctx) => {
  const query = req.url.searchParams
  const name = query.get("name")
})\
`,
    `\
[MSW] Found a redundant usage of query parameters in the request handler URL for "POST /login?id=123&type=auth". Please match against a path instead, and access query parameters in the response resolver function:

rest.post("/login", (req, res, ctx) => {
  const query = req.url.searchParams
  const id = query.get("id")
  const type = query.get("type")
})\
`,
  ])

  await runtime
    .request({
      url: runtime.makeUrl('/user?name=admin'),
    })
    .then(async (res) => {
      expect(res.status()).toBe(200)
      expect(await res.text()).toBe('user-response')
    })

  await runtime
    .request({
      url: runtime.makeUrl('/user'),
    })
    .then(async (res) => {
      expect(res.status()).toBe(200)
      expect(await res.text()).toBe('user-response')
    })

  await runtime
    .request({
      url: runtime.makeUrl('/login?id=123&type=auth'),
      fetchOptions: {
        method: 'POST',
      },
    })
    .then(async (res) => {
      expect(res.status()).toBe(200)
      expect(await res.text()).toBe('login-response')
    })

  await runtime
    .request({
      url: runtime.makeUrl('/login'),
      fetchOptions: {
        method: 'POST',
      },
    })
    .then(async (res) => {
      expect(res.status()).toBe(200)
      expect(await res.text()).toBe('login-response')
    })

  return runtime.cleanup()
})
