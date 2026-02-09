#!/usr/bin/env node

/**
 * 版本号管理脚本
 * 用法：
 *   node scripts/bump-version.js patch   # 2.0.0 -> 2.0.1
 *   node scripts/bump-version.js minor   # 2.0.0 -> 2.1.0
 *   node scripts/bump-version.js major   # 2.0.0 -> 3.0.0
 *   node scripts/bump-version.js build   # 2.0.0 -> 2.0.0.1 (增加 build 号)
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const bumpType = process.argv[2] || 'build';
const currentVersion = packageJson.version;
const currentVersionCode = packageJson.versionCode || 1;

function parseVersion(version) {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0,
    build: parseInt(parts[3]) || 0,
  };
}

function bumpVersion(version, type) {
  const v = parseVersion(version);

  switch (type) {
    case 'major':
      v.major += 1;
      v.minor = 0;
      v.patch = 0;
      v.build = 0;
      break;
    case 'minor':
      v.minor += 1;
      v.patch = 0;
      v.build = 0;
      break;
    case 'patch':
      v.patch += 1;
      v.build = 0;
      break;
    case 'build':
      v.build += 1;
      break;
    default:
      console.error(`Unknown bump type: ${type}`);
      console.error('Valid types: major, minor, patch, build');
      process.exit(1);
  }

  // 如果 build 为 0，不包含在版本号中
  if (v.build === 0) {
    return `${v.major}.${v.minor}.${v.patch}`;
  }
  return `${v.major}.${v.minor}.${v.patch}.${v.build}`;
}

const newVersion = bumpVersion(currentVersion, bumpType);
const newVersionCode = currentVersionCode + 1;

// 更新 package.json
packageJson.version = newVersion;
packageJson.versionCode = newVersionCode;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log('');
console.log('✅ Version updated successfully!');
console.log('');
console.log(`  Old version: ${currentVersion} (versionCode: ${currentVersionCode})`);
console.log(`  New version: ${newVersion} (versionCode: ${newVersionCode})`);
console.log('');
console.log('Changes:');
console.log(`  - package.json: version ${currentVersion} -> ${newVersion}`);
console.log(`  - package.json: versionCode ${currentVersionCode} -> ${newVersionCode}`);
console.log('');
