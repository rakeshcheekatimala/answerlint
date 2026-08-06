# answerlint

[![npm version](https://img.shields.io/npm/v/answerlint.svg)](https://www.npmjs.com/package/answerlint)
[![Node.js](https://img.shields.io/node/v/answerlint.svg)](https://www.npmjs.com/package/answerlint)
[![Tests, coverage, and audit](https://img.shields.io/github/actions/workflow/status/rakeshcheekatimala/answerlint/ci.yml?branch=main&label=tests%20%7C%20coverage%20%7C%20audit)](https://github.com/rakeshcheekatimala/answerlint/actions/workflows/ci.yml)
[![Snyk Security](https://img.shields.io/github/actions/workflow/status/rakeshcheekatimala/answerlint/snyk.yml?branch=main&label=Snyk%20Security)](https://github.com/rakeshcheekatimala/answerlint/actions/workflows/snyk.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/rakeshcheekatimala/answerlint/codeql.yml?branch=main&label=CodeQL)](https://github.com/rakeshcheekatimala/answerlint/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rakeshcheekatimala/answerlint/badge)](https://scorecard.dev/viewer/?uri=github.com/rakeshcheekatimala/answerlint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/rakeshcheekatimala/answerlint/blob/main/LICENSE)

`answerlint` shows whether AI answer engines can understand, trust, and cite your
content—and what to improve when they cannot.

## Why teams can trust this release

AnswerLint is open source, published from a protected GitHub Actions release
workflow, and checked on every change. You do not have to take a badge on trust:
each badge links to the public evidence behind it.

| Signal | What it means in plain English |
|---|---|
| npm version | Shows the version users actually receive from npm. |
| Node.js | Shows the supported Node.js runtime declared by the package. |
| Tests, coverage, and audit | Runs the test matrix, enforces at least 85% line coverage, checks package contents, and audits dependencies. |
| Snyk Security | Scans dependencies and source code for high-severity security findings. |
| CodeQL | GitHub analyzes the JavaScript and TypeScript for security vulnerabilities. |
| OpenSSF Scorecard | Provides an independent, public assessment of repository security practices. |
| MIT License | Confirms the permissions and conditions under which the library can be used. |

Releases use npm Trusted Publishing with short-lived OpenID Connect credentials,
so no long-lived npm publishing token is stored in the repository. npm also
records provenance for the published package. These controls reduce supply-chain
risk, but no automated scan can promise that software is completely defect-free.

![How AnswerLint turns content into clearer, more citable answers](assets/how-answerlint-works.png)

### Priority feature tour

![Animated walkthrough of AnswerLint priority features and commands](assets/answerlint-priority-features.gif)

## How It Helps

```text
Your content          AnswerLint checks           You improve
URL / Markdown   →    clarity + trust + evidence  → direct answers
folder / sitemap      14 built-in checks           stronger sources
                                                   clearer authorship
```

1. **Add content.** Start with one URL or Markdown file, or audit a folder or
   sitemap when you are ready to scale.
2. **Inspect clarity and trust.** AnswerLint checks direct-answer quality,
   entities, readability, authorship, freshness, sources, structured data, and
   citation readiness.
3. **Fix what matters.** Each failed or warning check includes evidence,
   priority, expected score impact, and a recommended change.
4. **Edit and recheck.** Update the source yourself and run the audit again—or
   use the local TUI to refresh automatically whenever a Markdown file is saved.

> AnswerLint never rewrites your content silently. It explains the problem and
> recommends a change; you keep editorial control.

### Choose the shortest path

| I want to… | Run |
|---|---|
| Improve one Markdown document while writing | `npx answerlint@latest tui --watch ./article.md` |
| Check one published page | `npx answerlint@latest audit --url "https://example.com/page" --output html` |
| Review a content library | `npx answerlint@latest audit --dir ./docs --output csv` |
| Prevent a pull request regression | `npx answerlint@latest diff --base-report base.json --head-report current.json --fail-on-regression` |
| Validate AI manifests and live links | `npx answerlint@latest lint-llms llms.txt --ci` |
| Produce code-scanning output | `npx answerlint@latest audit --dir ./docs --output sarif` |

The scores help prioritize work. They do not guarantee rankings or citations.

## What Teams Can Answer

It helps teams answer four practical questions:

- Is this page structured clearly enough for AI systems to summarize, trust, and cite?
- How does this page compare with a competitor or reference page?
- Did this pull request improve or weaken AI visibility before it ships?
- Is the site publishing a clean, valid `llms.txt` roadmap for AI agents?

The package reads pages, local files, folders, sitemaps, or existing audit
reports, runs a deterministic AEO/GEO rubric, and produces reports with scores,
evidence, and recommended fixes.

![HTML audit report - composite, AEO/GEO gauges, and per-check results](assets/report-hero.png)

## Why It Exists

Traditional SEO checks do not always reveal whether a page is useful to AI answer engines.

A page can rank in search and still be weak for:

- direct answer extraction
- entity and topic clarity
- source and authorship trust
- freshness signals
- external proof links
- comparison-friendly content
- citation readiness

`answerlint` is designed to be a lightweight quality gate for that layer of work. Think of it like Lighthouse or ESLint, but for AI visibility signals in content.

## What Makes It Different

- **Deterministic by default**: no hidden LLM judge is required to score a page.
- **Evidence-backed**: every audit produces a pass, warning, or failure with supporting evidence.
- **CI-friendly**: use score thresholds and diff gates to fail a build when visibility regresses.
- **LLM roadmap automation**: generate and lint `llms.txt` / `llms-full.txt` from source content during builds.
- **Readable for humans**: HTML reports make it easy for content, SEO, and engineering teams to review the same findings.
- **Reusable for tooling**: JSON and CSV outputs are stable enough for dashboards, PR comments, and downstream automation.
- **Useful before shipping**: AI Visibility Diff compares baseline and pull request reports before changes go live.

## Features

Current CLI commands:

- `answerlint overview`
- `answerlint info`
- `answerlint audit`
- `answerlint diff`
- `answerlint llms generate`
- `answerlint llms lint`

Supported audit inputs:

- live URL
- local Markdown or HTML file
- local folder of content files
- sitemap or sitemap index

Supported outputs:

- HTML for human review
- JSON for automation
- CSV for batch audit summaries
- HTML or JSON diff reports for pull request workflows
- competitor comparison reports when `audit --compare` is used with `--url`
- generated `llms.txt` and optional `llms-full.txt` for AI agents

## llms.txt Generation & Linting

Generate a site-level AI roadmap from a public website URL. AnswerLint fetches
the seed page, discovers sitemap URLs when available, falls back to same-site
homepage links, extracts deterministic titles/descriptions, and writes a valid
`llms.txt`:

```bash
answerlint llms generate \
  --url "https://example.com" \
  --site-name "Example Site" \
  --summary "Example Site publishes product docs and implementation guides." \
  --out ./public \
  --full
```

When crawling a preview or staging URL, use `--site` to emit production links:

```bash
answerlint llms generate \
  --url "https://preview.example.dev" \
  --site "https://example.com" \
  --out ./public
```

Generate a deterministic AI roadmap from local Markdown, MDX, or HTML content:

```bash
answerlint llms generate \
  --dir ./docs \
  --site "https://example.com" \
  --site-name "Example Site" \
  --summary "Example Site publishes product docs and implementation guides." \
  --out ./public \
  --full
```

Validate the generated file in CI:

```bash
answerlint llms lint ./public/llms.txt --strict --ci
```

The generator uses deterministic extraction only: frontmatter, HTML metadata, H1s, first paragraphs, URLs, and path-based sectioning. No AI or model key is required. This keeps build output reproducible and reviewable. AI-assisted summaries may be added later as an explicit opt-in layer, but the core feature is designed to be stable in CI.

## Quick Start

Fastest way to understand the product:

- website and playground: [useanswerlint.com](https://useanswerlint.com/)
- npm package: [answerlint on npm](https://www.npmjs.com/package/answerlint)
- source code: [GitHub repo](https://github.com/rakeshcheekatimala/answerlint)

Run without installing globally:

```bash
npx answerlint overview
```

Install globally:

```bash
npm install -g answerlint
```

Audit one live page:

```bash
answerlint audit \
  --url "https://example.com/docs/article" \
  --output html \
  --output-path ./answerlint-report.html
```

Audit one local file:

```bash
answerlint audit \
  --file ./examples/sample.html \
  --output json \
  --output-path ./answerlint-report.json
```

Audit a folder:

```bash
answerlint audit \
  --dir ./examples \
  --output csv \
  --output-path ./answerlint-batch.csv
```

Audit a sitemap:

```bash
answerlint audit \
  --sitemap "https://example.com/sitemap.xml" \
  --output csv \
  --output-path ./answerlint-sitemap.csv
```

## Competitor Compare

Competitor compare audits a target URL and a competitor or reference URL side by side.

Use it when you want to understand where another page has stronger answerability, citation, schema, or trust signals.

```bash
answerlint audit \
  --url "https://example.com/docs/article" \
  --compare "https://competitor.example/docs/article" \
  --output html \
  --output-path ./answerlint-compare-report.html
```

Generate a JSON comparison report:

```bash
answerlint audit \
  --url "https://example.com/docs/article" \
  --compare "https://competitor.example/docs/article" \
  --output json \
  --output-path ./answerlint-compare-report.json
```

Compare mode is currently supported for `--url` audits. Folder, file, and sitemap comparison workflows are planned follow-ups.

## AI Visibility Diff

AI Visibility Diff compares a baseline audit report with a current pull request report. It shows whether a change improved or regressed AI visibility.

This is useful in CI because it catches content and markup regressions before deployment.

Compare two existing JSON audit reports:

```bash
answerlint diff \
  --base-report ./baseline-report.json \
  --head-report ./current-report.json \
  --output html \
  --output-path ./answerlint-diff-report.html
```

Generate a machine-readable diff:

```bash
answerlint diff \
  --base-report ./baseline-report.json \
  --head-report ./current-report.json \
  --output json \
  --output-path ./answerlint-diff-report.json
```

Fail CI when visibility regresses:

```bash
answerlint diff \
  --base-report ./baseline-report.json \
  --head-report ./current-report.json \
  --fail-on-regression \
  --max-composite-drop 0 \
  --max-aeo-drop 0 \
  --max-geo-drop 0 \
  --max-citation-readiness-drop 0
```

Require minimum improvements:

```bash
answerlint diff \
  --base-report ./baseline-report.json \
  --head-report ./current-report.json \
  --min-composite-delta 0 \
  --min-aeo-delta 0 \
  --min-geo-delta 0
```

Example diff summary:

```json
{
  "summary": {
    "status": "improved",
    "baseScore": 74,
    "headScore": 82,
    "delta": 8
  },
  "scoreDiffs": {
    "composite": {
      "base": 74,
      "head": 82,
      "delta": 8,
      "status": "improved"
    },
    "aeo": {
      "base": 78,
      "head": 85,
      "delta": 7,
      "status": "improved"
    }
  },
  "ci": {
    "passed": true,
    "reasons": []
  }
}
```

## What It Checks

The current audit rubric contains 14 built-in checks, plus declarative project rules.

### AEO

- FAQ or HowTo schema
- direct answer in the first paragraph
- Q&A density
- readability
- named entities
- author byline

### GEO

- topical depth
- trust signals
- content freshness
- external citations
- comparison content
- citation likelihood
- entity relationship density based on explicit Wikipedia/Wikidata nodes
- outbound citation health (HTTP failures, redirects, and recognized authoritative domains)

Diff reports also derive higher-level comparison signals such as citation readiness, schema quality, content clarity, entity coverage, evidence quality, author/date/source signals, answerability, and AI extractability.

## How Scoring Works

The workflow is intentionally simple:

1. Read content from a URL, file, folder, sitemap, or JSON report.
2. Normalize and parse content.
3. Run deterministic AEO and GEO checks.
4. Compute `aeo`, `geo`, and `composite` scores.
5. Attach recommendations for failed or warning checks.
6. Write a report in HTML, exhaustive batch JSON, CSV, SARIF, comparison, or diff format.

Score bands:

| Band | Meaning |
|---|---|
| `poor` | Major AI visibility gaps |
| `needs-improvement` | Useful foundation, but important signals are missing |
| `good` | Strong baseline for answer and citation readiness |
| `excellent` | Well-structured, evidence-rich, and easy to extract |

By default, AEO contributes `50%` and GEO contributes `50%` to the composite score.

## CI integration

AnswerLint does not require a particular CI provider. Any runner that can run
Node.js can use the same command, JSON report, and exit codes. Provider-specific
configuration is only needed to schedule the job and retain the report.

### Portable CI contract

Use these environment variables in any CI system:

| Variable | Purpose | Example |
|---|---|---|
| `ANSWERLINT_URL` | Public page to audit | `https://example.com/` |
| `ANSWERLINT_THRESHOLD` | Minimum passing composite score | `40` |
| `ANSWERLINT_REPORT_PATH` | JSON report destination | `./answerlint-report.json` |
| `ANSWERLINT_VERSION` | Pinned npm version for reproducible builds | `1.2.1` |

Run the same audit command on every platform:

```bash
npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
  --url "$ANSWERLINT_URL" \
  --ci \
  --threshold "$ANSWERLINT_THRESHOLD" \
  --output json \
  --output-path "$ANSWERLINT_REPORT_PATH"
```

Pin `ANSWERLINT_VERSION` and update it intentionally. Using `@latest` is useful
for local evaluation, but it can change CI results without a corresponding
repository change.

Configure the provider to publish `ANSWERLINT_REPORT_PATH` even when the audit
step fails. This preserves the evidence and recommendations for a score-gate
failure. The process exit code remains the portable gate:

| Exit code | Meaning |
|---|---|
| 0 | Audit completed and passed the configured threshold |
| 1 | Audit completed but failed the score gate |
| 2 | Crawl or runtime error |
| 3 | Invalid input, configuration, or diff report |

### Generic shell example

This example works in any Unix-like runner. The CI provider should supply the
environment variables and handle artifact publication separately.

```bash
#!/usr/bin/env bash
set -u

: "${ANSWERLINT_URL:?Set ANSWERLINT_URL to the page to audit}"
: "${ANSWERLINT_THRESHOLD:=40}"
: "${ANSWERLINT_REPORT_PATH:=./answerlint-report.json}"
: "${ANSWERLINT_VERSION:=1.2.1}"

npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
  --url "$ANSWERLINT_URL" \
  --ci \
  --threshold "$ANSWERLINT_THRESHOLD" \
  --output json \
  --output-path "$ANSWERLINT_REPORT_PATH"
```

AnswerLint prints the score summary to the job log before returning its exit
code. The JSON artifact contains the complete scores, check counts, failure
priorities, page evidence, recommended changes, and potential score impact.

| Provider | Immediate results | Complete report |
|---|---|---|
| GitHub Actions | Job log and job summary | Workflow artifact |
| GitLab CI | Job log | Job artifact |
| Jenkins | Console output | Archived artifact |
| CircleCI | Step output | Artifacts tab |
| Azure Pipelines | Task log | Pipeline artifact |

### Common audit commands

Fail a deployment preview if the page score is below a threshold:

```bash
answerlint audit \
  --url "$DEPLOY_URL" \
  --ci \
  --threshold 70 \
  --output json \
  --output-path ./answerlint-report.json
```

Compare mode does not change CI threshold behavior. When `--ci` and `--compare` are used together, the threshold is checked against the target URL composite score only; competitor scores and deltas are reported for context.

Fail a pull request if the current report regresses against the baseline:

```bash
answerlint diff \
  --base-report ./baseline-report.json \
  --head-report ./current-report.json \
  --output json \
  --output-path ./answerlint-diff-report.json \
  --fail-on-regression \
  --fail-on-high-severity
```

### GitHub Actions

Save the following workflow as `.github/workflows/answerlint.yml`. Run it from
the **Actions** tab and set the minimum acceptable composite score. The workflow
fails when the audited page scores below that threshold, writes a detailed job
summary for reviewers, and retains the JSON report for 14 days.

```yaml
name: AnswerLint website audit

on:
  workflow_dispatch:
    inputs:
      threshold:
        description: Minimum composite score required to pass
        required: true
        default: "40"
        type: string

permissions:
  contents: read

env:
  ANSWERLINT_VERSION: "1.2.1"

jobs:
  answerlint:
    name: Audit website
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false

      - name: Run AnswerLint
        run: |
          npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
            --url "https://example.com/" \
            --ci \
            --threshold "${{ inputs.threshold }}" \
            --output json \
            --output-path ./answerlint-report.json

      - name: Generate job summary
        if: ${{ always() }}
        env:
          ANSWERLINT_THRESHOLD: ${{ inputs.threshold }}
        run: |
          if [[ ! -f answerlint-report.json ]]; then
            {
              echo "## AnswerLint CI report"
              echo
              echo "AnswerLint did not produce a report."
              echo "Check the **Run AnswerLint** step for a crawl or runtime error."
            } >> "$GITHUB_STEP_SUMMARY"
            exit 0
          fi

          composite=$(jq -r '.scores.composite' answerlint-report.json)
          aeo=$(jq -r '.scores.aeo' answerlint-report.json)
          geo=$(jq -r '.scores.geo' answerlint-report.json)
          band=$(jq -r '.scores.band' answerlint-report.json)
          failed=$(jq '[.audits[] | select(.status != "pass")] | length' answerlint-report.json)
          passed=$(jq '[.audits[] | select(.status == "pass")] | length' answerlint-report.json)

          if (( composite >= ANSWERLINT_THRESHOLD )); then
            gate="✅ Passed"
          else
            gate="❌ Failed — score ${composite} is below ${ANSWERLINT_THRESHOLD}"
          fi

          {
            echo "## 🔍 AnswerLint CI report"
            echo
            echo "**Result:** ${gate}"
            echo
            echo "| Metric | Result |"
            echo "| --- | ---: |"
            echo "| Composite score | **${composite}/100** |"
            echo "| Required score | **${ANSWERLINT_THRESHOLD}/100** |"
            echo "| AEO score | ${aeo}/100 |"
            echo "| GEO score | ${geo}/100 |"
            echo "| Score band | ${band} |"
            echo "| Passed checks | ${passed} |"
            echo "| Failed checks | ${failed} |"
            echo
            echo "### Recommended improvements"
            echo
            echo "Expand each check for its evidence and suggested fix."
            echo
          } >> "$GITHUB_STEP_SUMMARY"

          jq -r '
            .audits[]
            | select(.status != "pass")
            | "<details>\n<summary><strong>" +
              (if .recommendation.priority == "high" then "🔴 HIGH"
               elif .recommendation.priority == "medium" then "🟠 MEDIUM"
               else "🟡 " + ((.recommendation.priority // "review") | ascii_upcase)
               end) +
              " — " + .title +
              " (potential +" +
              ((.recommendation.score_impact // 0) | tostring) +
              " points)</strong></summary>\n\n" +
              "**Category:** " + (.category | ascii_upcase) + "  \n" +
              "**Evidence:** " +
              (.evidence // "No evidence provided.") + "\n\n" +
              "**Recommended fix:** " +
              (.recommendation.instruction // "No recommendation provided.") +
              "\n\n</details>\n"
          ' answerlint-report.json >> "$GITHUB_STEP_SUMMARY"

      - name: Upload AnswerLint report
        if: ${{ always() }}
        uses: actions/upload-artifact@v7
        with:
          name: answerlint-report
          path: answerlint-report.json
          if-no-files-found: error
          retention-days: 14
```

Replace `https://example.com/` with the page you want to audit. GitHub-hosted
Ubuntu runners already include `jq`, which the summary step uses to read the
JSON report.

The GitHub job summary displays:

- composite, AEO, and GEO scores
- the required threshold
- passed and failed check counts
- the priority of each failed check
- evidence gathered from the page
- recommended changes
- potential score impact

The complete JSON report is also available under **Artifacts**, even when the
score gate fails.

#### Run automatically

To audit the website whenever code is pushed to `main`, replace the
`workflow_dispatch` trigger with:

```yaml
on:
  push:
    branches:
      - main
```

An automatic run has no `inputs.threshold` value. Define a fixed threshold at
the top level instead:

```yaml
env:
  ANSWERLINT_THRESHOLD: "40"
```

Then update the audit command to use that environment variable:

```yaml
--threshold "$ANSWERLINT_THRESHOLD"
```

The summary step already reads `ANSWERLINT_THRESHOLD`, so remove its step-level
`env` block that references `${{ inputs.threshold }}`.

For scheduled monitoring, use the same fixed top-level threshold and replace
the trigger with:

```yaml
on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:
```

This runs every Monday at 06:00 UTC and still permits manual runs.

### GitLab CI

Add this job to `.gitlab-ci.yml`. `when: always` retains the JSON report when
the score gate fails.

```yaml
answerlint:
  image: node:24
  variables:
    ANSWERLINT_URL: "https://example.com/"
    ANSWERLINT_THRESHOLD: "40"
    ANSWERLINT_REPORT_PATH: "answerlint-report.json"
    ANSWERLINT_VERSION: "1.2.1"
  script:
    - >-
      npx --yes "answerlint@${ANSWERLINT_VERSION}" audit
      --url "$ANSWERLINT_URL"
      --ci
      --threshold "$ANSWERLINT_THRESHOLD"
      --output json
      --output-path "$ANSWERLINT_REPORT_PATH"
  artifacts:
    when: always
    name: "answerlint-${CI_COMMIT_SHORT_SHA}"
    paths:
      - answerlint-report.json
    expire_in: 14 days
```

Use `rules` or the top-level `workflow` configuration to run the job for merge
requests, the default branch, or a pipeline schedule.

### Jenkins

Use a declarative `Jenkinsfile`. The `post` block runs after both passing and
failing audits, so Jenkins archives the report without changing AnswerLint's
exit code.

```groovy
pipeline {
  agent {
    docker { image 'node:24' }
  }

  environment {
    ANSWERLINT_URL = 'https://example.com/'
    ANSWERLINT_THRESHOLD = '40'
    ANSWERLINT_REPORT_PATH = 'answerlint-report.json'
    ANSWERLINT_VERSION = '1.2.1'
  }

  stages {
    stage('Audit website') {
      steps {
        sh '''
          npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
            --url "$ANSWERLINT_URL" \
            --ci \
            --threshold "$ANSWERLINT_THRESHOLD" \
            --output json \
            --output-path "$ANSWERLINT_REPORT_PATH"
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'answerlint-report.json', allowEmptyArchive: true
    }
  }
}
```

Use a Jenkins timer trigger such as `cron('H 6 * * 1')` for weekly monitoring.
Jenkins hashes `H`, so the exact minute is distributed across available agents.

### CircleCI

Add this job and workflow to `.circleci/config.yml`. CircleCI artifact steps
are processed after the command so the JSON report remains available for
inspection.

```yaml
version: 2.1

jobs:
  answerlint:
    docker:
      - image: cimg/node:24.0
    environment:
      ANSWERLINT_URL: "https://example.com/"
      ANSWERLINT_THRESHOLD: "40"
      ANSWERLINT_REPORT_PATH: "answerlint-report.json"
      ANSWERLINT_VERSION: "1.2.1"
    steps:
      - run:
          name: Audit website
          command: |
            npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
              --url "$ANSWERLINT_URL" \
              --ci \
              --threshold "$ANSWERLINT_THRESHOLD" \
              --output json \
              --output-path "$ANSWERLINT_REPORT_PATH"
      - store_artifacts:
          path: answerlint-report.json
          destination: answerlint-report.json

workflows:
  website-audit:
    jobs:
      - answerlint
```

CircleCI scheduled pipelines can invoke the same `website-audit` workflow
without changing the job itself.

### Azure Pipelines

Add the following job to `azure-pipelines.yml`. `condition: always()` publishes
the report after a passing audit, score-gate failure, or runtime failure.

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  ANSWERLINT_URL: "https://example.com/"
  ANSWERLINT_THRESHOLD: "40"
  ANSWERLINT_REPORT_PATH: "$(Build.ArtifactStagingDirectory)/answerlint-report.json"
  ANSWERLINT_VERSION: "1.2.1"

steps:
  - task: NodeTool@0
    displayName: Set up Node.js
    inputs:
      versionSpec: "24.x"

  - script: |
      npx --yes "answerlint@${ANSWERLINT_VERSION}" audit \
        --url "$ANSWERLINT_URL" \
        --ci \
        --threshold "$ANSWERLINT_THRESHOLD" \
        --output json \
        --output-path "$ANSWERLINT_REPORT_PATH"
    displayName: Audit website

  - task: PublishPipelineArtifact@1
    displayName: Publish AnswerLint report
    condition: always()
    inputs:
      targetPath: "$(Build.ArtifactStagingDirectory)"
      artifact: answerlint-report
```

For scheduled monitoring, add an Azure Pipelines `schedules` trigger and keep
the job variables unchanged.

### Adapting another CI system

For Buildkite, Bitbucket Pipelines, TeamCity, or another provider, apply the
same three-part integration:

1. Run the portable command with Node.js and the four environment variables.
2. Treat AnswerLint's exit code as the build gate without translating it.
3. Publish the JSON report using the provider's "always run" or equivalent
   artifact mechanism.

## Command Reference

```text
answerlint overview
answerlint info

answerlint audit [options]
  --url <url>
  --file <path>
  --dir <path>
  --sitemap <url>
  --output <format>                 html | json | csv
  --output-path <path>
  --threshold <n>
  --ci
  --ignore-robots
  --depth <n>
  --rate <n>
  --config <path>
  --probe
  --models <list>
  --compare <url>

answerlint diff [options]
  --base-report <path>
  --head-report <path>
  --output <format>                 html | json
  --output-path <path>
  --fail-on-regression
  --fail-on-high-severity
  --max-composite-drop <n>
  --max-aeo-drop <n>
  --max-geo-drop <n>
  --max-citation-readiness-drop <n>
  --min-composite-delta <n>
  --min-aeo-delta <n>
  --min-geo-delta <n>
  --min-citation-readiness-delta <n>

answerlint llms generate [options]
  --url <url>
  --dir <path>
  --sitemap <url>
  --site <url>                       required with --dir; optional public origin override
  --site-name <name>
  --summary <text>
  --out <dir>
  --full
  --max-links <n>
  --max-full-chars <n>

answerlint llms lint <file>
  --strict
  --ci
  --max-chars <n>

answerlint lint-llms [files...]
  --no-check-links
  --concurrency <n>
  --timeout <ms>
  --strict
  --ci
```

Current implementation notes:

- `--compare` audits the target and competitor URLs side by side; it is only supported with `--url`.
- `diff` currently compares existing JSON audit reports.
- `action.yml` consumes base/head JSON reports, updates a structured PR comment, and enforces score floors and drop limits.
- `--probe` exists, but probe mode is not implemented yet.
- `--depth` is accepted, but the current crawler does not use it yet.
- batch JSON contains every page; SARIF contains every non-passing finding for code-scanning ingestion.

## Configuration

Optional config loading order:

1. `--config <path>`
2. `.answerlintrc.json` in the current project
3. legacy `.answerlint.json` in the current project
4. `.answerlint.json` in the home directory

Example:

```json
{
  "audit": {
    "aeo_weight": 0.5,
    "geo_weight": 0.5,
    "custom_weights": {
      "faq_schema": 1.5,
      "direct_answer": 1.5,
      "citation_likelihood": 1.3
    }
  },
  "ci": {
    "threshold": 70,
    "fail_on_drop": true
  },
  "rules": [
    { "id": "brand-name", "type": "required-term", "value": "AnswerLint", "category": "aeo" },
    { "id": "legacy-name", "type": "forbidden-term", "value": "Old Brand" },
    { "id": "source-policy", "type": "required-link", "value": "doi.org" }
  ]
}
```

Rule types are deliberately non-executable: `required-term`, `forbidden-term`, and
`required-link`. This keeps repository configuration reviewable and safe in CI.

## GitHub Action

Generate baseline and pull-request JSON reports in earlier steps, then invoke the
repository action. Pin production workflows to a release tag or full commit SHA.

```yaml
permissions:
  contents: read
  pull-requests: write

steps:
  - uses: actions/checkout@<full-commit-sha>
  - uses: rakeshcheekatimala/answerlint@<release-tag-or-full-commit-sha>
    with:
      base-report: artifacts/base.json
      head-report: artifacts/head.json
      github-token: ${{ secrets.GITHUB_TOKEN }}
      min-composite-score: 70
      min-aeo-score: 65
      min-geo-score: 65
      max-composite-drop: 0
```

The action updates one marker-based comment rather than creating a new comment on
every run. It exits non-zero when a configured score floor or delta gate fails.

## Best Practices

Start with one known page before running a folder or sitemap audit. It is easier to validate the rubric and review recommendations on content you understand well.

Use `html` when a person will read the report. Use `json`, `csv`, or `sarif` when another tool will consume it.

Use `csv` or JSON for full batch audit runs. Tune large sitemaps with `--concurrency <n>`; the bounded worker pool prevents unbounded sockets.

Use `audit --compare` when you want a live side-by-side benchmark against a competitor, reference page, or category leader.

Use `diff` in pull requests. A single score is useful, but a before/after comparison is more useful for release decisions.

Treat scores as prioritization signals, not guarantees. This project helps improve content quality systematically; it does not promise rankings, citations, or model behavior.

If your site is heavily client-rendered, audit rendered HTML output or local exports when possible. The current implementation does not run a browser.

Respect `robots.txt`, rate limits, and site terms when auditing third-party URLs.

## Local Development

```bash
git clone https://github.com/rakeshcheekatimala/answerlint.git
cd answerlint
npm install
npm run lint
npm run build
npm test
npm run test:coverage
```

Useful smoke tests:

```bash
node dist/index.js audit --file ./examples/sample.html --output html --output-path ./sample-report.html
node dist/index.js audit --file ./examples/sample.md --output json --output-path ./sample-report.json
node dist/index.js audit --dir ./examples --output csv --output-path ./examples-report.csv
node dist/index.js audit --url "https://example.com" --compare "https://www.iana.org/help/example-domains" --output json --output-path ./compare-report.json
node dist/index.js diff --base-report ./sample-report.json --head-report ./sample-report.json --output html --output-path ./sample-diff.html
```

Coverage artifacts are written to:

- [coverage/index.html](coverage/index.html)
- [coverage/report.md](coverage/report.md)
- [coverage/summary.json](coverage/summary.json)

## Contributing

Contributions are welcome. The project is intentionally small, deterministic, and practical.

Good contribution areas include:

- new AEO/GEO checks with clear evidence
- better scoring explainability
- richer compare and diff reports
- GitHub Action and PR comment workflows
- sitemap and batch reporting improvements
- documentation and real-world examples

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Project Health

Latest verified local snapshot on `2026-07-02`:

| Metric | Status |
|---|---|
| Typecheck | `npm run lint` passing |
| Build | `npm run build` passing |
| Tests | `39/39` passing with Node 23.11.0 |

Note: the current `npm test` script uses `node --import`, so contributors should run tests with a Node version that supports that flag. Node 20+ is recommended for local development.

## Roadmap

Planned directions:

- live URL diff without pre-generated JSON reports
- sitemap-to-sitemap diff reports
- GitHub PR comments
- Markdown CI summaries
- historical baselines
- browser-rendered audits for client-heavy pages
- optional LLM probe workflows
- competitor diff mode

## Docs

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/requirements.md](docs/requirements.md)
- [docs/suggestions.md](docs/suggestions.md)

## Limitations

- no browser rendering for JavaScript-heavy pages
- no implemented probe workflow yet
- no live URL or sitemap diff workflow yet
- no recursive local directory traversal
- no aggregated HTML or JSON output for multi-page batch audit runs

## Release Process

Releases are automated with `semantic-release` from `main`.

Version bumps follow conventional commits:

- `fix:` for patch releases
- `feat:` for minor releases
- `feat!:` or `BREAKING CHANGE:` for major releases

Preview the next version locally:

```bash
npm run release:dry-run
```

`semantic-release` itself requires Node 24 for the release step, so the local dry run uses an ephemeral Node 24 runtime even if day-to-day development uses Node 20+.

The release workflow runs typecheck, build, and tests, then publishes to npm and creates a GitHub release when the commit history since the last tag contains a releasable change.

## License

[MIT](LICENSE). Please report suspected vulnerabilities through the private
process described in the [security policy](SECURITY.md).

## Zero-token local playground

Watch a Markdown document while editing it in your usual editor:

```bash
npx answerlint@latest tui --watch ./docs/article.md
# equivalent in version one
npx answerlint@latest tui ./docs/article.md
```

“Zero-token” means the playground uses AnswerLint's deterministic audit rules: it does not call an LLM, require an API key, consume model tokens, or send the document, its path, scores, or recommendations over the network. Processing stays on your machine and the watched file is never modified. Supported inputs are one local `.md` or `.mdx` file.

Saving the file triggers a debounced refresh (200 ms by default). Scores only advance after a successful audit, so a temporary or incomplete editor save leaves the last results visible as stale. Use `--debounce <ms>` to change the delay, `--no-color` to disable color, and `--json-debug` for content-free local diagnostic events.

Keyboard shortcuts: `Tab`/`Shift+Tab` changes panel focus, arrow keys navigate checks, `Enter` expands evidence, `f` filters issues, `r` refreshes immediately, `?` opens help, and `q` or `Ctrl+C` exits.

`answerlint audit` audits files, directories, URLs, or sitemaps and writes a persistent HTML/JSON/CSV report. `answerlint tui` is a watch-only, local terminal dashboard. Version one has no built-in editor, automatic rewriting/fixes, directory or URL dashboard, HTML editing, browser UI, cloud sync, or LLM-generated advice.
