#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
JAVA_BASE="${ANDROID_JAVA_HOME:-$(/usr/libexec/java_home -v 17)}"
BT="$SDK/build-tools/36.0.0"
ANDROID_JAR="$SDK/platforms/android-36/android.jar"
mkdir -p .build/classes .build/dex
sed 's/<manifest /<manifest package="cn.loop.training" /' app/src/main/AndroidManifest.xml > .build/AndroidManifest.xml
"$BT/aapt2" compile --dir app/src/main/res -o .build/resources.zip
"$BT/aapt2" link -o .build/resources.apk -I "$ANDROID_JAR" --manifest .build/AndroidManifest.xml -0 wav -A app/src/main/assets .build/resources.zip
"$JAVA_BASE/bin/javac" -encoding UTF-8 -source 8 -target 8 -classpath "$ANDROID_JAR" -d .build/classes app/src/main/java/cn/loop/training/*.java
"$JAVA_BASE/bin/jar" cf .build/classes.jar -C .build/classes .
JAVA_HOME="$JAVA_BASE" "$BT/d8" --lib "$ANDROID_JAR" --min-api 26 --output .build/dex .build/classes.jar
cp .build/resources.apk .build/unsigned.apk
(cd .build/dex && zip -q -u ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 .build/unsigned.apk .build/aligned.apk
if [ ! -f .build/development.jks ]; then
 "$JAVA_BASE/bin/keytool" -genkeypair -keystore .build/development.jks -storepass android -keypass android -alias loopdev -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Loop Development' >/dev/null 2>&1
fi
JAVA_HOME="$JAVA_BASE" "$BT/apksigner" sign --ks .build/development.jks --ks-pass pass:android --key-pass pass:android --out ../LoopTraining-1.6.5.apk .build/aligned.apk
JAVA_HOME="$JAVA_BASE" "$BT/apksigner" verify --verbose ../LoopTraining-1.6.5.apk
printf '\nBuilt: ../LoopTraining-1.6.5.apk\n'
