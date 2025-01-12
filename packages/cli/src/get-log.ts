import * as crypto from 'crypto';
import {
  Action,
  CheckupConfig,
  trimAllCwd,
  Task,
  TaskContext,
  CheckupMetadata,
  TaskListError,
  RunOptions,
  sarifBuilder,
} from '@checkup/core';
import * as stringify from 'json-stable-stringify';
import * as unparse from 'yargs-unparser';
import { Invocation, Log, ReportingDescriptor, Result } from 'sarif';
import { getVersion } from './utils/get-version';
import { getRepositoryInfo } from './utils/repository';
import TaskListImpl from './task-list';

function getInvocation(
  options: RunOptions,
  errors: TaskListError[],
  startTime: string
): Invocation {
  return {
    arguments: unparse(options),
    executionSuccessful: true,
    endTimeUtc: new Date().toJSON(),
    toolExecutionNotifications: sarifBuilder.notifications.fromTaskErrors(errors),
    startTimeUtc: startTime,
  };
}

export async function getLog(
  options: RunOptions,
  taskContext: TaskContext,
  taskResults: Result[],
  actions: Action[],
  errors: TaskListError[],
  taskList: TaskListImpl,
  executedTasks: Task[],
  startTime: string
): Promise<Log> {
  let checkupMetadata = await getCheckupMetadata(taskContext);

  return {
    version: '2.1.0',
    $schema: 'https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json',
    properties: { ...checkupMetadata, actions, timings: taskList.timings },
    runs: [
      {
        results: taskResults,
        invocations: [getInvocation(options, errors, startTime)],
        tool: {
          driver: {
            name: 'Checkup',
            rules: getReportingDescriptors(executedTasks),
            language: 'en-US',
            informationUri: 'https://github.com/checkupjs/checkup',
            version: checkupMetadata.cli.version,
          },
        },
      },
    ],
  };
}

/**
 *
 * @param taskNames
 * @returns {ReportingDescriptor[]} used to populate tool.driver.rules
 */
function getReportingDescriptors(tasks: Task[]): ReportingDescriptor[] {
  return tasks.map((task: Task) => {
    return {
      id: task.taskName,
      shortDescription: { text: task.taskDisplayName },
      properties: { enabled: task.enabled, group: task.group, category: task.category },
    };
  });
}

function getConfigHash(checkupConfig: CheckupConfig) {
  let configAsJson = stringify(checkupConfig);

  return crypto.createHash('md5').update(configAsJson).digest('hex');
}

async function getCheckupMetadata(taskContext: TaskContext): Promise<CheckupMetadata> {
  let package_ = taskContext.pkg;
  let repositoryInfo = await getRepositoryInfo(taskContext.options.cwd, taskContext.paths);
  let analyzedFiles = trimAllCwd(taskContext.paths, taskContext.options.cwd);

  return {
    project: {
      name: package_.name || '',
      version: package_.version || '',
      repository: repositoryInfo,
    },

    cli: {
      configHash: getConfigHash(taskContext.config),
      config: taskContext.config,
      version: getVersion(),
      schema: 1,
      options: unparse(taskContext.options),
    },

    analyzedFiles,
    analyzedFilesCount: analyzedFiles.length,
  };
}
