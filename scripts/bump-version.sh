#!/bin/bash
# 사용법: ./scripts/bump-version.sh 1.0.3

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/bump-version.sh <version>"
  echo "Example: ./scripts/bump-version.sh 1.0.3"
  exit 1
fi

# app.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" app.json

# ios/app/Info.plist (CFBundleShortVersionString)
sed -i '' "/<key>CFBundleShortVersionString<\/key>/{n;s/<string>.*<\/string>/<string>$VERSION<\/string>/;}" ios/app/Info.plist

# ios/RoutineWidget/Info.plist (MARKETING_VERSION은 build settings에서 관리)

echo "Version bumped to $VERSION"
echo "  - app.json ✓"
echo "  - ios/app/Info.plist ✓"
echo ""
echo "Don't forget to update CHANGELOG.md"
