/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const CharsetDefinedAudit = require('../../../audits/dobetterweb/charset.js');
const assert = require('assert');
const networkRecordsToDevtoolsLog = require('../../network-records-to-devtools-log.js');

/* eslint-env jest */

describe('Charset defined audit', () => {
  it('succeeds when the page contains the charset meta tag', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<meta charset="utf-8" />',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });

  it('succeeds when the page has the charset defined in the content-type meta tag', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<meta http-equiv="Content-type" content="text/html; charset=utf-8" />',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });

  it('succeeds when the page has the charset defined in the content-type http header', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html; charset=UTF-8'},
      ],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<meta http-equiv="Content-type" content="text/html" />',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });

  it('succeeds when the page has the charset defined via BOM', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html'},
      ],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '\ufeff<meta http-equiv="Content-type" content="text/html" />',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });

  it('fails when the page does not have charset defined', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html'},
      ],
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<meta http-equiv="Content-type" content="text/html" />',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 0);
    });
  });

  it('fails when the page has charset defined too late in the page', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html'},
      ],
    };
    const bigString = new Array(1024).fill(' ').join('');
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<html><head>' + bigString + '<meta charset="utf-8" />hello',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 0);
    });
  });



  it('passes when the page has charset defined almost too late in the page', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html'},
      ],
    };
    const bigString = new Array(900).fill(' ').join('');
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: '<html><head>' + bigString + '<meta charset="utf-8" />hello',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });


  it('fails when the page has charset only partially defined in the first 1024 bytes of the page', () => {
    const finalUrl = 'https://example.com/';
    const mainResource = {
      url: finalUrl,
      responseHeaders: [
        {name: 'content-type', value: 'text/html'},
      ],
    };
    const prelude = '<html><head>';
    const charsetHTML = '<meta charset="utf-8" />';
    // 1024 bytes should be halfway through the meta tag
    const bigString = new Array(1024 - prelude.length - charsetHTML.length / 2).fill(' ').join('');

    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);
    const artifacts = {
      devtoolsLogs: {[CharsetDefinedAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
      MainDocumentContent: prelude + bigString + charsetHTML + 'hello',
    };

    const context = {computedCache: new Map()};
    return CharsetDefinedAudit.audit(artifacts, context).then(auditResult => {
      assert.equal(auditResult.score, 0);
    });
  });

});
