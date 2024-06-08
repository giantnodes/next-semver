import fs from 'node:fs'

import * as core from '@actions/core'
import { when } from 'jest-when'
import semver from 'semver'

import { run } from '../src/index'

const path = 'VERSION.txt'

let exists: jest.SpiedFunction<typeof fs.existsSync>
let read: jest.SpiedFunction<typeof fs.promises.readFile>
let write: jest.SpiedFunction<typeof fs.promises.writeFile>
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

    exists = jest.spyOn(fs, 'existsSync')
    read = jest.spyOn(fs.promises, 'readFile')
    write = jest.spyOn(fs.promises, 'writeFile')
    input = jest.spyOn(core, 'getInput')
    failed = jest.spyOn(core, 'setFailed')
    output = jest.spyOn(core, 'setOutput')
    inc = jest.spyOn(semver, 'inc')

    when(exists).calledWith(path).mockReturnValue(true)
    when(read).calledWith(path, 'utf-8').mockResolvedValue('1.0.0\nlatest')
    when(write).mockResolvedValue()
    when(input).calledWith('path').mockReturnValue(path)
    when(input).calledWith('type').mockReturnValue('major')
    when(input).calledWith('identifier').mockReturnValue('')
  })

  test('outputs incremented version when no identifier provided', async () => {
    // act
    await run()

    // assert
    expect(output).toHaveBeenCalledWith('version', '2.0.0')
    expect(output).toHaveBeenCalledWith('tag', 'latest')
  })

  test('outputs incremented version when identifier provided', async () => {
    // arrange
    when(read).calledWith(path, 'utf-8').mockResolvedValue('1.0.0-canary.1\ncanary')
    when(input).calledWith('type').mockReturnValue('prerelease')
    when(input).calledWith('identifier').mockReturnValue('canary')

    // act
    await run()

    // assert
    expect(output).toHaveBeenCalledWith('version', '1.0.0-canary.2')
    expect(output).toHaveBeenCalledWith('tag', 'canary')
  })

  test('writes incremented version and tag to version file', async () => {
    // act
    await run()

    // assert
    expect(write).toHaveBeenCalledWith(path, '2.0.0\nlatest', 'utf-8')
  })

  test('fails when invalid path provided', async () => {
    // arrange
    const path = 'unknown.txt'

    when(input).calledWith('path').mockReturnValue(path)

    // act
    await run()

    // assert
    expect(failed).toHaveBeenCalledWith(`the file at path '${path}' cannot be found.`)
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

    when(read).calledWith(path, 'utf-8').mockResolvedValueOnce(version)

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
