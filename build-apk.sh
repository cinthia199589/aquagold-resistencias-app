#!/bin/bash
# Build APK script for Capacitor Android app

cd android

echo "================================"
echo "Building Aquagold Resistencias APK"
echo "================================"
echo ""

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo "Error: gradlew not found!"
    exit 1
fi

# Build debug APK
echo "Building Debug APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "APK location:"
    echo "app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "You can now install it on your Android device:"
    echo "adb install app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Build failed!"
    exit 1
fi
