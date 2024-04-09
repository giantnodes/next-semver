import * as core from '@actions/core'
import semver from 'semver'

export const run = async () => {
  try {
    const version = core.getInput('version')
    const type = core.getInput('type') as semver.ReleaseType
    const identifier = core.getInput('identifier')

    if (!semver.RELEASE_TYPES.includes(type)) {
      core.setFailed(`'${type}' is not a valid semver release type`)

      return
    }

    const output = semver.inc(version, type, identifier)

    if (output == null) {
      core.setFailed(`'${version}' is not a valid version number`)

      return
    }

    core.info(`incremented version from ${version} to ${output}`)
    core.setOutput('version', output)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
