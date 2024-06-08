<div id="top"></div>
<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/giantnodes">
    <img src="https://i.imgur.com/A7o5VUv.png" alt="giantnodes logo" width="350">
  </a>

  <h3 align="center">giantnodes/next-semver</h3>

  <p align="center">
    A GitHub action that increments to the next semantic version via a version file.
    <br />
    <a href="https://github.com/giantnodes/next-semver"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/giantnodes/next-semver/issues">Bug Report</a>
    ·
    <a href="https://github.com/giantnodes/next-semver/issues">Feature Request</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li>
      <a href="#usage">Usage</a>
    </li>
    <li>
      <a href="#contributing">Contributing</a>
    </li>
    <li>
      <a href="#license">License</a>
    </li>
  </ol>
</details>

## About The Project

The `@giantnodes/next-semver` GitHub Action simplifies the process of incrementing the semantic version of your packages following the Semantic Versioning (SemVer) guidelines. This action is designed to automate version management for projects, ensuring consistency and accuracy in version tracking.

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

To start using `@giantnodes/next-semver`, you first need to create and commit a version file that the action can reference. In the following examples, we'll use `VERSION.txt` as our version file.

For a new repository, if you don't have a version file yet, it should be defined as follows:

```txt
0.0.0
latest
```

For an existing repository where you want to introduce `@giantnodes/next-semver` to increment versions going forward, you need to define the current version of your package along with the version identifier. For instance, if the latest version of your package is 12.4.5, the `VERSION.txt` should be:

```txt
12.4.5
latest
```

### Inputs

- **path**: specifies the file that tracks the version. This file should contain two lines:

  1. The version number
  2. The version type

  examples of a `VERSION.txt` file:

  ```txt
  1.3.5
  latest
  ```

  ```txt
  1.0.0-canary.17
  canary
  ```

- **type**: specifies the type of release being created. It can be one of the following:

  - `major`
  - `premajor`
  - `minor`
  - `preminor`
  - `patch`
  - `prepatch`
  - `prerelease`

- **identifier**: optional parameter used for prereleases, the identifier will be appended to the version as a prerelease identifier. For example, in `1.0.0-canary.17`, `canary` is the identifier.

### Outputs

- **version**: the incremented version that was generated.

- **tag**: for prereleases, this will match the provided release identifier. If no identifier is provided, it will default to latest.

<p align="right">(<a href="#top">back to top</a>)</p>

## Usage

Below is a comprehensive workflow example demonstrating how to use `@giantnodes/next-semver` alongside other action steps. Your workflow may vary, but this serves as a good illustration.

In this example, `@giantnodes/next-semver` is used to create a new version of a Node.js package and update a .NET NuGet package. We then check out a release branch, push the updated `VERSION.txt` file, versioned Node.js and NuGet packages, and create a tagged GitHub release. Finally, a pull request is raised from the release branch back to the main branch to merge the freshly versioned packages and `VERSION.txt` file.

```yml
name: '🏷️  Release'

on:
  workflow_dispatch:
    inputs:
      type:
        type: choice
        description: 'SemVer Increment'
        default: 'prerelease'
        required: true
        options:
          - prerelease
          - prepatch
          - patch
          - preminor
          - minor
          - premajor
          - major
      identifier:
        type: choice
        description: 'PreRelease Identifier'
        options:
          - canary

jobs:
  create-release:
    # increment the version defined in the root VERSION.txt file
    - name: '🏷️  Increment Version'
      id: version
      uses: giantnodes/next-semver@1.0.0
      with:
        path: VERSION.txt
        type: ${{ inputs.RELEASE_TYPE }}
        identifier: ${{ inputs.RELEASE_IDENTIFIER }}

    # version a NPM package...
    - name: '🏷️  Version @giantnodes/design-system'
      shell: bash
      run: |
        pnpm version ${{ steps.version.outputs.version }} --no-git-tag-version

    # or Version Nuget packages...
    - name: '⬇️  Install (dotnet-setversion)'
      shell: bash
      run: |
        dotnet tool install -g dotnet-setversion

    - name: '🏷️  Version (infrastructure)'
      working-directory: ./src/Infrastructure
      shell: bash
      run: |
        setversion --recursive ${{ steps.version.outputs.version }}

    # configure Git account that will create a release
    - name: '🏷️  Configure Git'
      shell: bash
      run: |
        git config --global user.name 'giantnodes-bot'
        git config --global user.email 'bot@giantnodes.com'

    # checkout a release branch and create a github release
    - name: '🏷️  Tag, Commit & Release'
      id: branch
      shell: bash
      run: |
        git checkout -b release/${{ steps.version.outputs.version }}
        git commit -anm 'chore(release): v${{ steps.version.outputs.version }}'
        git push origin release/${{ steps.version.outputs.version }}

        gh release create v${{ steps.version.outputs.version }} ${{ steps.version.outputs.tag == 'latest' && '--latest' || '--prerelease' }} --generate-notes

        echo "branch=$(git branch --show-current)" >> $GITHUB_OUTPUT
      env:
        GITHUB_TOKEN: ${{ inputs.GITHUB_TOKEN }}

  pull-request:
    name: '🏷️  Open Pull Request'
    runs-on: ubuntu-latest
    needs: [create-release]
    steps:
      # checkout our newly created release branch
      - name: '🐙️  Checkout'
        uses: actions/checkout@v4
        with:
          ref: ${{ needs.create-release.outputs.branch }}

      # raise a PR to the main branch so versions are updated
      - name: '🏷️  Open Pull Request'
        uses: thomaseizinger/create-pull-request@master
        with:
          title: 'chore(release): v${{ needs.create-release.outputs.version }}'
          labels: '🏷️ Release'
          github_token: ${{ secrets.GITHUB_TOKEN }}
          head: release/${{ needs.create-release.outputs.version }}
          base: main
```

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>
