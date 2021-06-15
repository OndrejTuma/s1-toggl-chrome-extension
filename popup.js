chrome.storage.sync.get('credentials', async ({ credentials }) => {
  document.body.className = credentials ? 'credentials' : ''
})

function isRedmineTaskUrl(url) {
  if (url.match(/https:\/\/task.siteone.cz\/(\/)?issues\/\d{5,}/)) {
    return true
  }

  alert('This extension can be used only for SiteOne Redmine issues')
}

window.addEventListener('load', async function () {
  document.getElementById('save').addEventListener('click', function () {
    const formData = new FormData(document.querySelector('form'))
    const credentials = {}
    for (const pair of formData.entries()) {
      credentials[pair[0]] = pair[1]
    }

    chrome.storage.sync.set({
      credentials,
    })
  })

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  document.getElementById('track').addEventListener('click', async function () {
    if (!isRedmineTaskUrl(tab.url)) {
      return
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['startTimer.js'],
    })
  })

  document.getElementById('checkoutBranch').addEventListener('click', function () {
    if (!isRedmineTaskUrl(tab.url)) {
      return
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['checkoutBranch.js'],
    })
  })
})

