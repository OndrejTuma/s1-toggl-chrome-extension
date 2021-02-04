function getAuthHeader(apiKey) {
  return 'Basic ' + btoa(apiKey + ':api_token')
}

function getProjectSelectValue() {
  const node = document.querySelector('#project_quick_jump_box > option[selected]')

  if (!node) {
    return ''
  }

  return node.innerText
}

function getReportNumber() {
  const node = document.getElementById('issue_custom_field_values_1')

  return node ? parseInt(node.value) : 0
}

function getRMName() {
  const parentTaskNumberNode = document.getElementById('issue_parent_issue_id')
  const taskSubjectNode = document.getElementById('issue_subject')

  const parentTaskNumber = parentTaskNumberNode ? parentTaskNumberNode.value : 0
  const taskNumber = window.location.toString().replace(/^.*issues\/([0-9]+).*$/, '$1')
  let taskSubject = taskSubjectNode ? taskSubjectNode.value : ''

  if (parentTaskNumber && taskSubject) {
    taskSubject = taskSubject.replace(new RegExp('\#' + parentTaskNumber + '[\-:, ]*', 'i'), '')
  }

  return (parentTaskNumber ? `#${parentTaskNumber} ` : '') + `#${taskNumber} - ${taskSubject}`
}

function getFailMessage(e) {
  return `Fetch failed - check network and console (${e.message})`
}

async function startTimer(apiKey, workSpaceId) {
  const taskName = getRMName()
  const reportNumber = getReportNumber()

  if (!reportNumber) {
    alert('Missing report number')
    return
  }

  let project

  try {
    const projectsResponse = await fetch(`https://api.track.toggl.com/api/v8/workspaces/${workSpaceId}/projects`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(apiKey),
      },
    })
    const projects = await projectsResponse.json()
    project = projects.find(({ name }) => parseInt(name) === reportNumber)
  } catch (e) {
    alert(getFailMessage(e))
    return
  }

  if (!project) {
    const projectsName = getProjectSelectValue()
    const projectName = prompt('This report number is not yet binded with project. Create new project:', `${reportNumber} - ${projectsName}`)

    if (!projectName) {
      return
    }

    try {
      const newProjectResponse = await fetch('https://api.track.toggl.com/api/v8/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
        body: JSON.stringify({
          project: {
            name: projectName,
            wid: workSpaceId,
          },
        }),
      })
      const { data } = await newProjectResponse.json()

      project = data
    } catch (e) {
      alert(getFailMessage(e))
      return
    }
  }

  try {
    await fetch('https://api.track.toggl.com/api/v8/time_entries/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(apiKey),
      },
      body: JSON.stringify({
        time_entry: {
          description: taskName,
          pid: project.id,
          created_with: 'bookmark',
        },
      }),
    })
  } catch (e) {
    alert(getFailMessage(e))
    return
  }

  alert('Tick-tack!')
}


chrome.storage.sync.get('credentials', ({ credentials }) => {
  const { apiKey, workspaceId } = credentials

  startTimer(apiKey, workspaceId)
})