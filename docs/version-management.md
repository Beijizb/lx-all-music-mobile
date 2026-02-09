# 版本号管理指南

## 版本号规则

本项目使用 **语义化版本号 + Build 号** 的格式：

```
主版本.次版本.修订号[.构建号]
MAJOR.MINOR.PATCH[.BUILD]
```

**示例**：
- `2.0.0` - 主版本 2，次版本 0，修订号 0
- `2.0.0.1` - 主版本 2，次版本 0，修订号 0，构建号 1
- `2.0.1` - 主版本 2，次版本 0，修订号 1
- `2.1.0` - 主版本 2，次版本 1，修订号 0

## 版本号类型说明

### 1. Build 号（构建号）- 最常用

**用途**：日常开发、bug 修复、小改动

**规则**：
- `2.0.0` → `2.0.0.1` → `2.0.0.2` → ...
- 每次推送代码时使用
- 不改变主要功能

**命令**：
```bash
npm run version:build
```

### 2. Patch（修订号）

**用途**：Bug 修复、小优化

**规则**：
- `2.0.0.5` → `2.0.1`（build 号重置为 0）
- 向后兼容的 bug 修复

**命令**：
```bash
npm run version:patch
```

### 3. Minor（次版本号）

**用途**：新增功能、较大改进

**规则**：
- `2.0.5` → `2.1.0`（patch 和 build 重置为 0）
- 向后兼容的新功能

**命令**：
```bash
npm run version:minor
```

### 4. Major（主版本号）

**用途**：重大更新、不兼容的 API 变更

**规则**：
- `2.5.3` → `3.0.0`（所有次级版本号重置为 0）
- 可能包含不兼容的变更

**命令**：
```bash
npm run version:major
```

## 使用流程

### 日常开发推送（推荐）

每次推送代码前：

```bash
# 1. 更新版本号（build +1）
npm run version:build

# 2. 提交版本号变更
git add package.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"

# 3. 推送代码
git push
```

### 快捷脚本

为了方便，可以创建一个组合命令。在 `package.json` 中添加：

```json
"scripts": {
  "release": "npm run version:build && git add package.json && git commit -m \"chore: bump version\" && git push"
}
```

然后只需运行：
```bash
npm run release
```

## 版本号示例

### 场景 1：日常开发

```bash
# 初始版本
2.0.0

# 修复了一个小 bug
npm run version:build  # -> 2.0.0.1

# 又修复了另一个 bug
npm run version:build  # -> 2.0.0.2

# 优化了性能
npm run version:build  # -> 2.0.0.3
```

### 场景 2：发布修订版

```bash
# 当前版本
2.0.0.5

# 累积了多个 bug 修复，发布修订版
npm run version:patch  # -> 2.0.1

# 继续日常开发
npm run version:build  # -> 2.0.1.1
```

### 场景 3：新功能发布

```bash
# 当前版本
2.0.5.3

# 开发了新功能，发布次版本
npm run version:minor  # -> 2.1.0

# 继续开发
npm run version:build  # -> 2.1.0.1
```

### 场景 4：重大更新

```bash
# 当前版本
2.5.10.8

# 重构了整个架构，发布主版本
npm run version:major  # -> 3.0.0

# 继续开发
npm run version:build  # -> 3.0.0.1
```

## versionCode 说明

`versionCode` 是 Android 专用的版本号，用于应用商店判断版本新旧：

- **规则**：每次更新版本号时自动 +1
- **用途**：Android 系统用来判断是否可以升级
- **特点**：只能递增，不能回退

**示例**：
```json
{
  "version": "2.0.0",
  "versionCode": 71
}
```

更新后：
```json
{
  "version": "2.0.0.1",
  "versionCode": 72
}
```

## 自动化建议

### Git Hooks（推荐）

可以使用 Git hooks 在推送前自动更新版本号。

创建 `.husky/pre-push`：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 自动更新 build 版本号
npm run version:build

# 提交版本号变更
git add package.json
git commit --amend --no-edit
```

### CI/CD 集成

在 `.github/workflows/build.yml` 中可以自动读取版本号：

```yaml
- name: Get version
  run: |
    VERSION=$(node -p "require('./package.json').version")
    echo "Building version: $VERSION"
    echo "VERSION=$VERSION" >> $GITHUB_ENV
```

## 查看当前版本

```bash
# 方法 1：查看 package.json
cat package.json | grep version

# 方法 2：使用 Node.js
node -p "require('./package.json').version"

# 方法 3：使用 npm
npm version
```

## 版本号历史

可以通过 Git 标签查看版本历史：

```bash
# 查看所有版本标签
git tag

# 查看特定版本的提交
git show v2.0.0

# 创建版本标签
git tag -a v2.0.0.1 -m "Release version 2.0.0.1"
git push --tags
```

## 最佳实践

### ✅ 推荐做法

1. **每次推送前更新 build 号**
   ```bash
   npm run version:build
   ```

2. **版本号提交单独进行**
   ```bash
   git add package.json
   git commit -m "chore: bump version to 2.0.0.1"
   ```

3. **重要版本打标签**
   ```bash
   git tag -a v2.0.0 -m "Release 2.0.0"
   git push --tags
   ```

4. **在 CHANGELOG 中记录变更**
   - 每个版本的主要变更
   - Bug 修复列表
   - 新功能说明

### ❌ 避免做法

1. **不要手动修改 versionCode**
   - 让脚本自动管理

2. **不要跳过版本号**
   - 保持连续性

3. **不要在同一个 commit 中混合代码和版本号**
   - 版本号更新应该是独立的 commit

## 故障排查

### 问题 1：版本号没有更新

**检查**：
```bash
node scripts/bump-version.js build
```

**解决**：确保脚本有执行权限

### 问题 2：versionCode 不连续

**原因**：可能手动修改了 package.json

**解决**：使用脚本统一管理

### 问题 3：CI 构建使用了旧版本号

**原因**：版本号更新后没有推送

**解决**：
```bash
git add package.json
git commit -m "chore: bump version"
git push
```

## 相关文件

- `scripts/bump-version.js` - 版本号管理脚本
- `package.json` - 版本号配置文件
- `.github/workflows/build.yml` - CI 构建配置

---

**当前版本**: 2.0.0.1
**versionCode**: 72
**更新时间**: 2026-02-09
