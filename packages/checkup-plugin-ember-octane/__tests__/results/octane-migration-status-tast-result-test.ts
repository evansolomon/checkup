import { TemplateLintReport, getRegisteredParsers } from '@checkup/core';

import { CLIEngine } from 'eslint';
import OctaneMigrationStatusTask from '../../src/tasks/octane-migration-status-task';
import OctaneMigrationStatusTaskResult from '../../src/results/octane-migration-status-task-result';
import { stdout, filterPieChartDataForTest } from '@checkup/test-helpers';

describe('octane-migration-status-task-result', () => {
  let sampleESLintReport: CLIEngine.LintReport;
  let sampleTemplateLintReport: TemplateLintReport;

  beforeEach(() => {
    sampleESLintReport = require('../__fixtures__/sample-octane-eslint-report.json');
    sampleTemplateLintReport = require('../__fixtures__/sample-octane-template-lint-report.json');
  });

  describe('console output', () => {
    test('simple console output', async () => {
      let task = new OctaneMigrationStatusTask({}, getRegisteredParsers());
      let taskResult = new OctaneMigrationStatusTaskResult(
        task.meta,
        sampleESLintReport,
        sampleTemplateLintReport
      );

      taskResult.stdout();

      expect(stdout()).toMatchSnapshot();
    });
  });

  describe('JSON output', () => {
    test('it should have basic JSON results', () => {
      let task = new OctaneMigrationStatusTask({}, getRegisteredParsers());
      let taskResult = new OctaneMigrationStatusTaskResult(
        task.meta,
        sampleESLintReport,
        sampleTemplateLintReport
      );

      let jsonResults = taskResult.json();

      expect(jsonResults).toMatchSnapshot();
    });
  });

  describe('PDF output', () => {
    test('it should have basic PDF results', () => {
      let task = new OctaneMigrationStatusTask({}, getRegisteredParsers());
      let taskResult = new OctaneMigrationStatusTaskResult(
        task.meta,
        sampleESLintReport,
        sampleTemplateLintReport
      );
      let pdfResults = taskResult.pdf();

      expect(filterPieChartDataForTest(pdfResults)).toMatchSnapshot();
    });
  });
});