import { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

const DEFAULT_ERROR_CODE = 403

type BlockListConfig = `${number}.${number}.${number}.${number}` | RegExp

interface BlocklistOptions {
  blocklist?: BlockListConfig[];
}

const anyIpsMatches = (ips: BlockListConfig[] | undefined, ip: string): boolean => {
  return ips && ips.length > 0 && ips.some(i => {
    return i instanceof RegExp ? i.test(ip) : i === ip
  }) || false
}

const blocklistPlugin: FastifyPluginCallback<BlocklistOptions> = (app, options, done) => {
  app.addHook('onRequest', function (req: FastifyRequest, reply: FastifyReply, next: () => void) {
    const { blocklist } = options
    if (anyIpsMatches(blocklist, req.ip)) {
      reply.code(DEFAULT_ERROR_CODE).send({ error: 'Blocked' })
    } else {
      next()
    }
  })
  done()
}

export default fp(blocklistPlugin, {
  name: 'fastify-blocklist'
})
