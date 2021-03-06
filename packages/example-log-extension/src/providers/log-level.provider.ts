// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-log-extension
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Provider} from '@loopback/context';
import {LOG_LEVEL} from '../keys';

export class LogLevelProvider implements Provider<number> {
  constructor() {}

  value(): number {
    const level = Number(process.env.LOG_LEVEL);
    if (!isNaN(level) && typeof level === 'number') return level;
    return LOG_LEVEL.WARN;
  }
}
