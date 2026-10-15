const http = require('node:http')
const { app } = require('./src/app')

const port = 3001
const host = '0.0.0.0'
http.createServer(app).listen(port, host, () => {
  console.log(`上新图 API 已启动：http://127.0.0.1:${port}`)
  console.log('真机联调请把前端 API 地址中的 127.0.0.1 替换为开发电脑的局域网 IP')
})
