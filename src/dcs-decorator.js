import { u } from './utils'
import { htmlBased } from './htmlBased'

//------------------------------------------------------------------------------

if (u.inIFrame()) {
  console.log('Docuss Decorator - Initializing...')
  htmlBased
    .connect({ discourseOrigin: '*', timeout: 10000 })
    .then(args => modifyDom(args))
    .then(args => htmlBased.parseDom(args))
    .catch(e => {
      if (typeof e === 'string') {
        console.log('Docuss Decorator Error - ' + e)
      } else {
        throw e
      }
    })
} else {
  console.log(
    'Docuss Decorator - Could not run, as the page is not displayed in a Docuss iframe'
  )
}

//------------------------------------------------------------------------------

let dcsTagSettings = null

function modifyDom({ descr, pageName, discourseOrigin, counts }) {
  // If no decorator, quit
  const decorator = descr.clientData && descr.clientData.decorator
  if (!decorator) {
    throw 'No decorator found in json descriptor'
  }

  // Keep the tag settings
  dcsTagSettings = descr.dcsTag

  // Insert the additional CSS
  const injectCss = (decorator.injectCss || []).reduce(
    (res, a) =>
      includesPageName({ pageNames: a.pageNames, pageName })
        ? res.concat(a.css)
        : res,
    []
  )
  if (injectCss.length) {
    const css = document.createElement('style')
    css.type = 'text/css'
    css.innerHTML = injectCss.join('\n')
    document.head.appendChild(css)
  }

  // Insert the global markup
  const allProps = decorator.pageProperties || []
  const pageProps = allProps
    .filter(p => includesPageName({ pageNames: p.pageNames, pageName }))
    .pop()
  const category = (pageProps && pageProps.category) || decorator.category
  const discourseTitle =
    (pageProps && pageProps.discourseTitle) || decorator.discourseTitle
  if (category) {
    document.documentElement.dataset.dcsCategory = category
  }
  if (discourseTitle) {
    document.documentElement.dataset.dcsDiscourseTitle = discourseTitle
  }

  // Insert the triggers' markup
  const allTriggers = decorator.injectTriggers || []
  const pageTriggers = allTriggers.filter(t =>
    includesPageName({ pageNames: t.pageNames, pageName })
  )
  const pageCounts = counts.filter(c => c.pageName === pageName)
  return u.dom.onDOMReady().then(() => {
    injectTriggers(pageTriggers, pageCounts)
    console.log('Docuss Decorator - Ready')
    return { descr, pageName, discourseOrigin, counts }
  })
}

//------------------------------------------------------------------------------

let htmlIds
let htmlIdsNotFound

function injectTriggers(triggers, counts) {
  // Check if the page already contains Docuss markup
  const dcsMarkup = !!document.querySelectorAll(
    '.dcs-subsec, .dcs-trigger, .dcs-icons, .dcs-badge'
  )
  if (dcsMarkup.length) {
    throw 'The page already contains Docuss markup'
  }

  htmlIdsNotFound = []

  // Pre-fill the html ids with the non-html ids, to indicate they are reserved
  htmlIds = triggers.reduce(
    (res, t) => (Array.isArray(t.ids) ? res.concat(t.ids) : res),
    []
  )

  triggers.forEach(trigger => addSubsections(trigger, counts))

  if (htmlIdsNotFound.length) {
    console.log(
      'Docuss Decorator Warning - Those triggers with id="@GENERATE_FROM_HTML_ID@" were assigned generated ids because no html id was found:',
      htmlIdsNotFound
    )
  }
}

function addSubsections(trigger, counts) {
  // Case there are no subsections
  if (!trigger.ui.subsection) {
    addTrigger(trigger, null, counts)
    return
  }

  // Case there are subsections
  const s = trigger.ui.subsection

  // Get the beginning nodes
  const beginNodes = document.querySelectorAll(s.begin)
  if (!beginNodes.length) {
    console.log(
      `Docuss Decorator Warning - Found nothing with begin="${s.begin}"`
    )
  }

  // Go through the subsecs
  u.dom.forEach(beginNodes, bn => {
    // Go up the tree as much as possible
    while (
      !bn.previousElementSibling &&
      bn.parentNode &&
      bn.parentNode.querySelectorAll(s.begin).length === 1 &&
      (!s.end || bn.parentNode.querySelectorAll(s.end).length === 0)
    ) {
      bn = bn.parentNode
    }

    // We create the subsection by picking beginNode and its following
    // siblings until we reach beginSubsecSelector or endSubsecSelector
    const endSelector = s.begin + (s.end ? ',' + s.end : '')
    const subsecNodes = [bn]
    let sibling = bn.nextSibling
    while (sibling) {
      if (
        sibling.nodeType === 1 &&
        (sibling.matches(endSelector) ||
          sibling.querySelectorAll(endSelector).length)
      ) {
        break
      }
      subsecNodes.push(sibling)
      sibling = sibling.nextSibling
    }

    // Create the subsec div
    const subsecWrapper = document.createElement('div')
    subsecWrapper.classList.add('dcs-subsec')
    u.dom.wrapAll(subsecNodes, subsecWrapper)

    // Add included cssSelector
    addTrigger(trigger, subsecWrapper, counts)
  })
}

function addTrigger(trigger, subsecNode, counts) {
  const target = subsecNode || document
  const triggerNodes = target.querySelectorAll(trigger.ui.cssSelector)
  u.dom.forEach(triggerNodes, (node, index) => {
    // Compute the triggerId
    let triggerId
    if (trigger.ids[0] === '@GENERATE_FROM_HTML_ID@') {
      triggerId = generateTriggerId(node, subsecNode, true)
    } else if (trigger.ids[0] === '@GENERATE@') {
      triggerId = generateTriggerId(node, null, false)
    } else {
      triggerId = trigger.ids[index % trigger.ids.length]
    }

    // Store the data as DOM params. We do this instead of attaching the trigger
    // object to the DOM node for 2 reasons:
    // 1. Remember that the triggerId is not associated with a single trigger
    // descriptor, but with a single node out of the many corresponding to a
    // trigger descriptor.
    // 2. We want developers to be able to use the docuss click handler without
    // the decorator code, by adding the Docuss html markup by hand.
    node.dataset.dcsTriggerId = triggerId
    node.dataset.dcsInteractMode = trigger.interactMode
    if (trigger.category) {
      node.dataset.dcsCategory = trigger.category
    }
    if (trigger.discourseTitle) {
      node.dataset.dcsDiscourseTitle = trigger.discourseTitle
    }
    if (trigger.ui.highlightable) {
      node.dataset.dcsHighlightable = true
    }

    // Add the docuss class to the trigger. DO THIS AFTER LOOKING FOR THE HTML
    // ID, as the dcs-trigger serves as a flag
    node.classList.add('dcs-trigger')

    // If required, insert span nodes around text parts
    // See: https://stackoverflow.com/a/10730777/3567351
    if (trigger.ui.insertTextSpan) {
      /*
      const span = document.createElement('span')
      subsecWrapper.classList.add('dcs-trigger-span')
      u.dom.wrapAll(tn.childNodes, span)
      */
      const w = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )
      let textNode
      while ((textNode = w.nextNode())) {
        if (textNode.data.trim()) {
          u.dom.wrap(
            textNode,
            u.dom.createElement('<span class="dcs-trigger-span"></span>')
          )
        }
      }
    } else {
      node.classList.add('dcs-no-span')
    }

    // Add the orange balloon icon if needed
    let iconsHtml = ''
    if (trigger.ui.insertBalloon) {
      iconsHtml += '<div class="dcs-balloon"></div>'
    } else {
      node.classList.add('dcs-no-balloon')
    }

    // Add the count badge icon if needed
    if (trigger.ui.insertCountBadge) {
      const record = counts.find(r => r.triggerId === triggerId)
      if (record && record.count !== 0) {
        iconsHtml += ` 
        <div class="dcs-badge" title="This section has ${
          record.count
        } topic(s)">
          ${record.count}
        </div>
      `
      }
    }

    // Add the icons to the DOM
    if (iconsHtml) {
      node.appendChild(
        u.dom.createElement(`
        <span class="dcs-icons" title="Click to discuss this subsection">
          ${iconsHtml}
        </span>
      `)
      )
    }
  })
}

function generateTriggerId(triggerNode, subsecNode, fromHtmlId) {
  // Get the closest htmlId
  let beforeClean = fromHtmlId ? findHtmlId(triggerNode, subsecNode) : null

  // If no html id is found, generate a default one
  if (!beforeClean) {
    beforeClean = `gen${htmlIdsNotFound.length}`
    htmlIdsNotFound.push({
      Text: triggerNode.innerText.trim(),
      'Generated Id': beforeClean
    })
  }

  // Generate an htmlId compatible with a lowercase 20 characters Discourse tag
  let afterClean = cleanTriggerId(beforeClean)

  // Check for htmlId duplicates after truncation
  if (htmlIds.includes(afterClean)) {
    const maxLength = dcsTagSettings.maxTriggerIdLength
    const save = afterClean
    for (let i = 1; ; ++i) {
      const iStr = i.toString()
      if (iStr.length > maxLength) {
        throw new Error('too many duplicated html ids')
      }
      const truncated = save.substring(0, maxLength - iStr.length)
      afterClean = truncated + iStr
      if (!htmlIds.includes(afterClean)) {
        break
      }
    }
  }

  // Store the id for later deduplication
  htmlIds.push(afterClean)

  return afterClean
}

function findHtmlId(triggerNode, subsecNode) {
  // First candidate is the node id
  if (triggerNode.id) {
    return triggerNode.id
  }

  // Second candidate is the id of a child element of the trigger
  const nodesWithId = triggerNode.querySelectorAll('[id]:not([id=""])')
  if (nodesWithId.length) {
    return nodesWithId[0].id
  }

  // Third candidate is the id of a parent that doesn't already contains a
  // trigger. This allows to go back the DOM tree and find sections containing
  // many headings, like in OpenSTack docs.
  let parent = triggerNode.parentElement
  while (parent) {
    if (parent.getElementsByClassName('dcs-trigger').length) {
      break
    }
    if (parent.id) {
      return parent.id
    }
    parent = parent.parentElement
  }

  // Fourth candidate is any id in the subsec
  if (subsecNode) {
    const subsecNodesWithId = subsecNode.querySelectorAll('[id]:not([id=""])')
    if (subsecNodesWithId.length) {
      return subsecNodesWithId[0].id
    }
  }

  return null
}

//------------------------------------------------------------------------------

function includesPageName({ pageNames, pageName }) {
  return pageNames.find(pn =>
    pn.endsWith('*') ? pageName.startsWith(pn.slice(0, -1)) : pn === pageName
  )
}

const TAG_REPLACE_REGEX = /[^0-9A-Za-z_]/g

function cleanTriggerId(triggerId) {
  const res = triggerId
    .substring(0, dcsTagSettings.maxTriggerIdLength)
    .replace(TAG_REPLACE_REGEX, '_')
  return dcsTagSettings.forceLowercase ? res.toLowerCase() : res
}
