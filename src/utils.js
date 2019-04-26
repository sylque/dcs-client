//------------------------------------------------------------------------------

export const u = {}

//------------------------------------------------------------------------------

// Return true if we are in an iframe
// https://stackoverflow.com/a/326076/3567351
u.inIFrame = () => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

//------------------------------------------------------------------------------

u.dom = {
  // Resolve when DOM is ready
  onDOMReady() {
    return new Promise(resolve => {
      if (document.readyState !== 'loading') {
        resolve()
      } else {
        document.addEventListener('DOMContentLoaded', resolve)
      }
    })
  },

  // https://github.com/imagitama/nodelist-foreach-polyfill/blob/master/index.js
  forEach(nodeList, callback, scope) {
    // Duplicate the list, so that we can iterate over a dynamic node list
    // returned by getElementsByClassName() and the likes. If we don't, the
    // following won't work, as we change the list dynamically while we iterate
    // over it:
    // u.dom.forEach(document.getElementsByClassName('toto'), node => node.classList.remove('toto'))
    const list = [...nodeList]
    for (let i = 0; i < list.length; i++) {
      callback.call(scope || window, list[i], i)
    }
  },

  wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el)
    wrapper.appendChild(el)
    return wrapper
  },

  wrapAll(elArray, wrapper) {
    if (elArray && elArray.length) {
      // Duplicate the array in case it is a DOM nodeList than would be modified
      // while we move elements
      const copyArray = Array.prototype.slice.call(elArray)
      copyArray[0].parentNode.insertBefore(wrapper, copyArray[0])
      copyArray.forEach(el => wrapper.appendChild(el))
    }
    return wrapper
  },

  createElement(htmlString) {
    const div = document.createElement('div')
    div.innerHTML = htmlString.trim()
    return div.firstChild
  }
}

//------------------------------------------------------------------------------
