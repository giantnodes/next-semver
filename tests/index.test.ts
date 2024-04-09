import * as core from '@actions/core'
import { when } from 'jest-when'
import semver from 'semver'

import { run } from '../src/index'

let input: jest.SpiedFunction<typeof core.getInput>
let failed: jest.SpiedFunction<typeof core.setFailed>
let output: jest.SpiedFunction<typeof core.setOutput>
let inc: jest.SpiedFunction<typeof semver.inc>

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  info: jest.fn()
}))

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    input = jest.spyOn(core, 'getInput')
    failed = jest.spyOn(core, 'setFailed')
    output = jest.spyOn(core, 'setOutput')
    inc = jest.spyOn(semver, 'inc')

    when(input).calledWith('version').mockReturnValue('1.0.0')
    when(input).calledWith('type').mockReturnValue('major')
    when(input).calledWith('identifier').mockReturnValue('')
  })

  test('increments version number when no identifier provided', async () => {
    // act
    await run()

    // assert
    expect(output).toHaveBeenCalledWith('version', '2.0.0')
  })

  test('increments version number when identifier provided', async () => {
    // arrange
    when(input).calledWith('type').mockReturnValue('prerelease')
    when(input).calledWith('identifier').mockReturnValue('canary')

    // act
    await run()

    // assert
    expect(output).toHaveBeenCalledWith('version', '1.0.1-canary.0')
  })

  test('outputs version increment as a info message', async () => {
    // arrange
    const version = '1.0.0'
    const info = jest.spyOn(core, 'info')

    when(input).calledWith('version').mockReturnValue(version)

    // act
    await run()

    // assert
    expect(info).toHaveBeenCalledWith(`incremented version from ${version} to 2.0.0`)
  })

  test('fails when invalid semver release type provided', async () => {
    // arrange
    const type = 'bogus'

    when(input).calledWith('type').mockReturnValue(type)

    // act
    await run()

    // assert
    expect(failed).toHaveBeenCalledWith(`'${type}' is not a valid semver release type`)
  })

  test('fails when invalid version provided', async () => {
    // arrange
    const version = 'bogus'

    when(input).calledWith('version').mockReturnValue(version)

    // act
    await run()

    // assert
    expect(failed).toHaveBeenCalledWith(`'${version}' is not a valid version number`)
  })

  test('fails when unexpected exception thrown', async () => {
    // arrange
    const message = 'something wrong here...'

    inc.mockImplementationOnce(() => {
      throw new Error(message)
    })

    // act
    await run()

    // assert
    expect(failed).toHaveBeenCalledWith(message)
  })
})
