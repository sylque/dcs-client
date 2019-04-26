import { htmlBased } from './htmlBased'

htmlBased.connect({ discourseOrigin: '*', timeout: 10000 }).then(
  args => {
    htmlBased.parseDom(args)
  },
  e => logError('Unable to connect to dcs-discourse-plugin2', e)
)
