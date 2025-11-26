package com.lxb.music.mobile.cache;

import android.content.Context;

import java.io.File;

// https://github.com/midas-gufei/react-native-clear-app-cache/tree/master/android/src/main/java/com/learnta/clear
public class Utils {
  /**
   * 鑾峰彇鐩綍鏂囦欢澶у皬
   *
   * @param dir
   * @return
   */
  static public long getDirSize(File dir) {
    if (dir == null || !dir.isDirectory()) return 0;
    long dirSize = 0;
    File[] files = dir.listFiles();
    if (files == null) return dirSize;
    for (File file : files) {
      if (file.isFile()) {
        dirSize += file.length();
      } else if (file.isDirectory()) {
        dirSize += file.length();
        dirSize += getDirSize(file); // 閫掑綊璋冪敤缁х画缁熻
      }
    }
    return dirSize;
  }

  /**
   * 鍒ゆ柇褰撳墠鐗堟湰鏄惁鍏煎鐩爣鐗堟湰鐨勬柟娉?   *
   * @param VersionCode
   * @return
   */
  static public boolean isMethodsCompat(int VersionCode) {
    int currentVersion = android.os.Build.VERSION.SDK_INT;
    return currentVersion >= VersionCode;
  }

  static public File getExternalCacheDir(Context context) {

    // return context.getExternalCacheDir(); API level 8

    // e.g. "<sdcard>/Android/data/<package_name>/cache/"

    return context.getExternalCacheDir();
  }

  /**
   * 娓呴櫎缂撳瓨鐩綍
   * 鐩綍
   * 褰撳墠绯荤粺鏃堕棿
   */
  static public int clearCacheFolder(File dir, long curTime) {
    int deletedFiles = 0;
    if (dir == null || !dir.isDirectory()) return deletedFiles;
    File[] files = dir.listFiles();
    if (files == null) return deletedFiles;
    try {
      for (File child : files) {
        if (child.isDirectory()) {
          deletedFiles += clearCacheFolder(child, curTime);
        }
        if (child.lastModified() < curTime) {
          if (child.delete()) {
            deletedFiles++;
          }
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
    return deletedFiles;
  }
}
