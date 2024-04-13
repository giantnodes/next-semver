import fs from 'node:fs'

import * as core from '@actions/core'
import semver from 'semver'

export const run = async () => {
  try {
    const path = core.getInput('path')

    if (!fs.existsSync(path)) {
      core.setFailed(`the file at path '${path}' cannot be found.`)

      return
    }

    const type = core.getInput('type') as semver.ReleaseType
    const identifier = core.getInput('identifier')

    if (!semver.RELEASE_TYPES.includes(type)) {
      core.setFailed(`'${type}' is not a valid semver release type`)

      return
    }

    const version = (await fs.promises.readFile(path, 'utf-8')).trim()
    const output = semver.inc(version, type, identifier)

    if (output == null) {
      core.setFailed(`'${version}' is not a valid version number`)

      return
    }

    core.info(`version incremented from ${version} to ${output}`)
    core.setOutput('version', output)

    await fs.promises.writeFile(path, output, 'utf-8')
    core.info(`overwritten '${path}' contents to '${output}'`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
