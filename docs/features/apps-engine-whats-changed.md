# Apps Engine – What’s Changed Guide

## Overview

The Apps Engine in Rocket.Chat evolves continuously with new features, API updates, and internal improvements. However, changes are often distributed across pull requests, commits, and release notes, making it difficult for developers to track updates efficiently.

This guide provides a structured and centralized overview of changes in the Apps Engine, helping contributors and app developers quickly understand what has been introduced, modified, or deprecated.

---

## Purpose

This document is intended to:

- Provide a quick summary of recent Apps Engine changes
- Highlight breaking changes that may impact existing apps
- Improve developer experience when upgrading or maintaining apps
- Serve as a reference point for contributors working on Apps Engine-related features

---

## Change Categories

Changes in the Apps Engine are categorized into the following sections:

### 🆕 New Features

Includes newly introduced APIs, capabilities, or functionality that expand what apps can do.

Examples:
- New Apps Engine methods
- Additional event hooks
- Extended API support

---

### ⚠️ Breaking Changes

Includes modifications that may break existing apps or require changes in implementation.

Examples:
- Removed or deprecated methods
- Changed method signatures
- Behavioral changes in existing APIs

**Important:** Developers should review this section carefully before upgrading.

---

### 🔧 Improvements

Includes enhancements that do not break compatibility but improve performance, usability, or maintainability.

Examples:
- Performance optimizations
- Internal refactoring
- Improved error handling

---

## Example Structure

Below is an example of how changes should be documented:

```md
### Version X.X.X

#### 🆕 New Features
- Added support for new Apps Engine API method `xyz()`

#### ⚠️ Breaking Changes
- Deprecated `oldMethod()` in favor of `newMethod()`

#### 🔧 Improvements
- Improved execution performance of app lifecycle events